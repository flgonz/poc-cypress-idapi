import { COMMON_CONSTANTS } from '../../utilities/common/constants';
const uuid = require('uuid');
const commonUtils = require('../../utilities/common/utils');
let userEmailAddress = commonUtils.generateRandomUserEmailAddress();
let anonymousAccessToken;
let anonymousRefreshToken;
let registeredAccessToken;
let registeredRefreshToken;

describe('Collection Anonymous Users', () => {

    describe('Positive Tests', () => {
        it('Create an anonymous user', () => {
            cy.request({
                method: 'POST',
                url: '/v1/auth/key/anon-user',
                headers: {
                    'x-vix-api-key': Cypress.env('vixapikey'),
                    'Content-Type': 'application/json'
                },
                body: {
                    'installationId': uuid.v4()
                }
            }).then(response => {
                expect(response).to.not.be.null;
                expect(response.status).to.equal(201);
                expect(response.statusText).to.equal('Created');
                expect(response.duration).to.not.be.greaterThan(COMMON_CONSTANTS.RESPONSE_TIME);
                expect(response.body).to.have.property('accessToken');
                expect(response.body).to.have.property('refreshToken');
                expect(response.body).to.have.property('expiresIn');
                expect(response.body).to.have.property('tokenType');
                expect(response.body.expiresIn).to.equal(COMMON_CONSTANTS.EXPIRES_IN_UUID);
                expect(response.body.tokenType).to.equal('Bearer');
                expect(response.headers).to.have.property('content-type');
                expect(response.headers['content-type']).to.equal('application/json; charset=utf-8');
                cy.log('Response is: \n' + JSON.stringify(response.body));
                anonymousAccessToken = response.body.accessToken;
                anonymousRefreshToken = response.body.refreshToken;
            });
        });

        it('Promote anonymous user to registered user', () => {
            cy.request({
                method: 'PUT',
                url: '/v1/auth/token/reg-user',
                headers: {
                    'Authorization': 'Bearer ' + anonymousAccessToken,
                    'Content-Type': 'application/json'
                },
                body: {
                    'email': userEmailAddress,
                    'password': 'univisionOscar03',
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

    describe('Negative Tests', () => {
        it('Create an anonymous user with empty body', () => {
            cy.request({
                method: 'POST',
                url: '/v1/auth/key/anon-user',
                headers: {
                    'x-vix-api-key': Cypress.env('vixapikey'),
                    'Content-Type': 'application/json'
                },
                body: {
                      
                },
                failOnStatusCode: false
            }).then(response => {
                expect(response).to.not.be.null;
                expect(response.status).to.equal(400);
                expect(response.statusText).to.equal('Bad Request');
                expect(response.duration).to.not.be.greaterThan(COMMON_CONSTANTS.RESPONSE_TIME);
                expect(response.body).to.have.property('error');
                expect(response.body).to.have.property('errorCode');
                expect(response.body).to.have.property('message');
                expect(response.body).to.have.property('statusCode');
                expect(response.body).to.have.property('validationErrors');
                expect(response.body.error).to.equal('Bad Request');
                expect(response.body.errorCode).to.equal('INVALID_INPUT');
                expect(response.body.message).to.equal('Invalid Input');
                expect(response.body.validationErrors).to.include('installationId should not be empty');
                expect(response.body.validationErrors).to.include('installationId must be a string');
                cy.log('Response is: \n' + JSON.stringify(response.body));
            });
        });

        it('Create an anonymous user incorrect API key', () => {
            cy.request({
                method: 'POST',
                url: '/v1/auth/key/anon-user',
                headers: {
                    'x-vix-api-key': Cypress.env('wrongvixapikey'),
                    'Content-Type': 'application/json'
                },
                body: {
                    'installationId': uuid.v4()
                },
                failOnStatusCode: false
            }).then(response => {
                expect(response).to.not.be.null;
                expect(response.status).to.equal(403);
                expect(response.statusText).to.equal('Forbidden');
                expect(response.duration).to.not.be.greaterThan(COMMON_CONSTANTS.RESPONSE_TIME);
                expect(response.body).to.have.property('error');
                expect(response.body).to.have.property('errorCode');
                expect(response.body).to.have.property('message');
                expect(response.body).to.have.property('statusCode');
                expect(response.body.error).to.equal('Invalid API Key');
                expect(response.body.errorCode).to.equal('INVALID_API_KEY');
                expect(response.body.message).to.equal('Invalid API Key');
                cy.log('Response is: \n' + JSON.stringify(response.body));
            });
        });

        it('Create an anonymous providing addtional inputs', () => {
            cy.request({
                method: 'POST',
                url: '/v1/auth/key/anon-user',
                headers: {
                    'x-vix-api-key': Cypress.env('vixapikey'),
                    'Content-Type': 'application/json'
                },
                body: {
                    'installationId': uuid.v4(),
                    'additionalInput': 'additionalInput'
                },
                failOnStatusCode: false
            }).then(response => {
                expect(response).to.not.be.null;
                expect(response.status).to.equal(400);
                expect(response.statusText).to.equal('Bad Request');
                expect(response.duration).to.not.be.greaterThan(COMMON_CONSTANTS.RESPONSE_TIME);
                expect(response.body).to.have.property('error');
                expect(response.body).to.have.property('errorCode');
                expect(response.body).to.have.property('message');
                expect(response.body).to.have.property('statusCode');
                expect(response.body).to.have.property('validationErrors');
                expect(response.body.error).to.equal('Bad Request');
                expect(response.body.errorCode).to.equal('INVALID_INPUT');
                expect(response.body.message).to.equal('Invalid Input');
                expect(response.body.validationErrors).to.include('property additionalInput should not exist');
                cy.log('Response is: \n' + JSON.stringify(response.body));
            });
        });
    });
});