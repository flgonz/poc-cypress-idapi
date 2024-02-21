import { COMMON_CONSTANTS } from '../../utilities/common/constants';
const commonUtils = require('../../utilities/common/utils');
const collections = require('../../utilities/collections/utils');
let userEmailAddress = commonUtils.generateRandomUserEmailAddress();
let anonReq = collections.collectionPreRequestUtils.getReqForCreateAnonUser();
let anonymousAccessToken;
let anonymousRefreshToken;
let registeredAccessToken;
let registeredRefreshToken;
let sessionId;
let profileId;
let userId;
let mediaId = 'video:mcp:4141679';
let seriesMediaId = 'series:mcp:2874';
let nextEpisodeMediaId = 'video:mcp:4141679';

describe('AUTS-470 CW Drop heartbeat requests with progress less than 20 seconds', () => {

    describe('Positive Tests', () => {
        describe('Series with code', () => {
            it('Promote anonymous user to registered user', () => {
                cy.request(anonReq).then(response => {
                    anonymousAccessToken = response.body.accessToken;
                    anonymousRefreshToken = response.body.refreshToken;
                    cy.request({
                        method: 'PUT',
                        url: '/v1/auth/token/reg-user',
                        headers: {
                            'Authorization': 'Bearer ' + anonymousAccessToken,
                            'Content-Type': 'application/json'
                        },
                        body: {
                            'email': userEmailAddress,
                            'password': 'univisionOscar04',
                            'refreshToken': anonymousRefreshToken
                            }
                    }).then(response => {
                        let tokenPayload = commonUtils.parseJwt(response.body.accessToken);
                        expect(response).to.not.be.null;
                        expect(response.status).to.equal(201);
                        expect(response.statusText).to.equal('Created');
                        expect(response.duration).to.not.be.greaterThan(COMMON_CONSTANTS.RESPONSE_TIME);
                        expect(response.body).to.have.property('accessToken');
                        expect(response.body).to.have.property('refreshToken');
                        expect(response.body).to.have.property('expiresIn');
                        expect(response.body).to.have.property('tokenType');
                        expect(response.body).to.have.property('profiles');
                        expect(response.body.accessToken).to.be.a('string');
                        expect(response.body.accessToken).to.not.be.null;
                        expect(response.body.refreshToken).to.be.a('string');
                        expect(response.body.refreshToken).to.not.be.null;
                        expect(response.body.profiles).to.be.an('array');
                        expect(response.body.profiles).to.not.be.empty;
                        expect(response.body.profiles[0]).to.have.all.keys('id','name','avatarId');
                        expect(response.body.profiles[0].name).to.equal('Default');
                        expect(response.body.expiresIn).to.equal(COMMON_CONSTANTS.EXPIRES_IN_UUID);
                        expect(response.body.tokenType).to.equal('Bearer');
                        expect(response.headers).to.have.property('content-type');
                        expect(response.headers['content-type']).to.equal('application/json; charset=utf-8');
                        expect(tokenPayload.usertype).to.equal('registered');
                        expect(tokenPayload.profile).to.have.all.keys('kid','id');
                        expect(tokenPayload.profile.id).to.equal(response.body.profiles[0].id);
                        cy.log('Response is: \n' + JSON.stringify(response.body));
                        registeredAccessToken = response.body.accessToken;
                        registeredRefreshToken = response.body.refreshToken;
                        userId = tokenPayload.sub;
                        profileId = tokenPayload.profile.id;    
                    });
                });  
            });

            it('Generate play session', () => {
                cy.request({
                    method: 'POST',
                    url: 'https://heartbeat-api.qa.vix.tv/v1/play-session?type=SVOD',
                    headers: {
                        'x-vix-api-key': Cypress.env('vixapikey'),
                        'Authorization': 'Bearer ' + registeredAccessToken,
                        'Content-Type': 'application/json'
                    },
                    body: {

                    }
                }).then(response => {
                    expect(response).to.not.be.null;
                    expect(response.status).to.equal(201);
                    expect(response.statusText).to.equal('Created');
                    expect(response.headers).to.have.property('content-type');
                    expect(response.headers['content-type']).to.equal('application/json; charset=utf-8');
                    expect(response.duration).to.not.be.greaterThan(COMMON_CONSTANTS.RESPONSE_TIME);
                    expect(response.body).to.have.property('sessionId');
                    expect(response.body).to.have.property('expiry');
                    expect(response.body).to.have.property('expiresIn');
                    expect(response.body.sessionId).to.not.equal(null);
                    //Need a expect to check expiry is a Date
                    expect(response.body.expiresIn).to.be.lessThan(20);
                    sessionId = response.body.sessionId;
                    cy.log('Response is: \n' + JSON.stringify(response.body));
                });
            });

            it('Add series item to CW with currentPosition less than 20', () => {
                cy.request({
                    method: 'PUT',
                    url: 'https://heartbeat-api.qa.vix.tv/v1/play-session/' + sessionId,
                    headers: {
                        'x-vix-api-key': Cypress.env('vixapikey'),
                        'Authorization': 'Bearer ' + registeredAccessToken,
                        'episodeNumber': 3,
                        'Content-Type': 'application/json'
                    },
                    body: 
                    {
                        'video': {
                            'mediaId': mediaId,
                            'currentPosition': 1,
                            'duration': 100,
                            'introStartPosition': 0,
                            'introEndPosition': 0,
                            'outroStartPosition': 0,
                            'seriesMediaId': seriesMediaId,
                            'nextEpisodeMediaId': nextEpisodeMediaId
                        }
                    }
                }).then(response => {
                    expect(response).to.not.be.null;
                    expect(response.status).to.equal(200);
                    expect(response.statusText).to.equal('OK');
                    expect(response.headers).to.have.property('content-type');
                    expect(response.headers['content-type']).to.equal('application/json; charset=utf-8');
                    expect(response.duration).to.not.be.greaterThan(COMMON_CONSTANTS.RESPONSE_TIME);
                    expect(response.body).to.have.property('sessionId');
                    expect(response.body).to.have.property('expiry');
                    expect(response.body).to.have.property('expiresIn');
                    expect(response.body.sessionId).to.not.equal(null);
                    //Need a expect to check expiry is a Date
                    expect(response.body.expiresIn).to.be.lessThan(20);
                    cy.log('Response is: \n' + JSON.stringify(response.body));
                });
            });
            
            it('CW lis validation', () => {
                cy.request({
                    method: 'GET',
                    url: 'https://api.qa.vix.tv/gw/id/v1/internal/media-activity/continue-watching',
                    headers: {
                        'gw-key': Cypress.env('gw-key'),
                        'Authorization': 'Bearer ' + registeredAccessToken,
                        'x-vix-user-id': userId,
                        'x-vix-profile-id': profileId
                    },
                }).then(response => {
                    expect(response).to.not.be.null;
                    expect(response.status).to.equal(200);
                    expect(response.statusText).to.equal('OK');
                    expect(response.headers).to.have.property('content-type');
                    expect(response.headers['content-type']).to.equal('application/json; charset=utf-8');
                    expect(response.duration).to.not.be.greaterThan(COMMON_CONSTANTS.RESPONSE_TIME);
                    expect(response.body.length).to.equal(0);
                    cy.log('Response is: \n' + JSON.stringify(response.body));
                });
            });

            it('Media activity validation', () => {
                cy.request({
                    method: 'GET',
                    url: 'https://api.qa.vix.tv/gw/id/v1/internal/media-activity?mediaIds=' + mediaId,
                    headers: {
                        'gw-key': Cypress.env('gw-key'),
                        'Authorization': 'Bearer ' + registeredAccessToken,
                        'x-vix-user-id': userId,
                        'x-vix-profile-id': profileId
                    },
                }).then(response => {
                    expect(response).to.not.be.null;
                    expect(response.status).to.equal(200);
                    expect(response.statusText).to.equal('OK');
                    expect(response.headers).to.have.property('content-type');
                    expect(response.headers['content-type']).to.equal('application/json; charset=utf-8');
                    expect(response.duration).to.not.be.greaterThan(COMMON_CONSTANTS.RESPONSE_TIME);
                    expect(response.body.length).to.equal(0);
                    cy.log('Response is: \n' + JSON.stringify(response.body));
                });
            });

            it('Delete registered user', () => {
                cy.request({
                    method: 'DELETE',
                    url: '/v1/auth/token/reg-user',
                    headers: {
                        'Authorization': 'Bearer ' + registeredAccessToken,
                        'Content-Type': 'application/json'
                    },
                    body: {
                        'refreshToken': registeredRefreshToken
                        }
                }).then(response => {
                    expect(response).to.not.be.null;
                    expect(response).to.not.have.keys('body');
                    expect(response.status).to.equal(204);
                    expect(response.statusText).to.equal('No Content');
                    expect(response.duration).to.not.be.greaterThan(COMMON_CONSTANTS.RESPONSE_TIME);
                });
            });
        });
    });
});