const {v4} = require('uuid')
const { faker } = require('@faker-js/faker');
const { dispatchPubSubEvent, payloadCreators} = require("../../functions/src/services/pubsub");

const firestoreId = `test_fs_id_${v4()}`;
const email = `${faker.internet.email()}_${faker.number.int({min: 1, max: 999})}`;
const username = `${faker.internet.displayName()}`;

dispatchPubSubEvent(payloadCreators.CREATE_USER({
    firestoreId,
    email,
    username
})).then(() => {
    console.log('Event dispatched');
}).catch((err) => {
    console.error('Error dispatching event', err);
});