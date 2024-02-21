const uuid = require('uuid');

export const collectionPreRequestUtils = {
    
    getReqForCreateAnonUser: () => {        
        const theRequest = {
            method: 'POST',
            url: '/v1/auth/key/anon-user',
            headers: {
                'x-vix-api-key': Cypress.env('vixapikey'),
                'Content-Type': 'application/json'
            },
            body: {
                'installationId': uuid.v4()
            }
        };
        return theRequest;
    }
}