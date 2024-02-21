import { COMMON_CONSTANTS } from '../../utilities/common/constants';
const users = require('../../fixtures/users.json');

describe('Pantaya Users', () => {
        it('Pre-check users', () => {
            users.forEach((user) => { 
                cy.request({
                    method: 'GET',
                    url: 'https://api.qa.vix.tv/gw/id/v1/internal/import/pre-check-user/' + user.uuid + '/' + user.token,
                    headers: {
                        'gw-key': Cypress.env('gw-key')
                    },
                    failOnStatusCode: false
                }).then(response => {
                    expect(response).to.not.be.null;
                    expect(response.status).to.equal(200);
                    expect(response.statusText).to.equal('OK');
                    expect(response.body).to.have.property('status');
                    expect(response.body.status).to.equal('MIGRATABLE');
                    expect(response.duration).to.not.be.greaterThan(COMMON_CONSTANTS.RESPONSE_TIME);
                    cy.log('Response is: \n' + JSON.stringify(response.body));
                });
            });
        });
});