const {publishEventToTopic} = require('./publishEventToTopic.js');
const {v4} = require('uuid')
const { faker } = require('@faker-js/faker');

const firestoreId = `test_fs_id_${v4()}`;
const email = `${faker.internet.email()}_${faker.number.int({min: 1, max: 999})}`;
const username = `${faker.internet.displayName()}`;

publishEventToTopic('create-user', {
    firestoreId,
    email,
    username
}).then(() => {
    console.log('Event published');
}).catch((err) => {
    console.error('Error publishing event', err);
})