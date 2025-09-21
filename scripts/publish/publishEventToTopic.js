const {PubSub} = require('@google-cloud/pubsub');
const {TopicNames} = require("../../functions/src/services/pubsub");


async function publishEventToTopic(topicName, event) {
    const pubsub = new PubSub();
    const topic = pubsub.topic(topicName);
    if (!(await topic.exists())[0]) {
        await topic.create();
    }
    return topic.publishMessage({data: Buffer.from(JSON.stringify(event))});
}

const oldPUBSUB_EMULATOR_HOST = process.env['PUBSUB_EMULATOR_HOST'];


process.env['PUBSUB_EMULATOR_HOST'] = 'localhost:8085';
publishEventToTopic(TopicNames.DAILY_GAME_UPDATE, {
    games: [{
        gameSqlId: "863e2a02-0481-4792-89b5-ea4338d5ff92",
        gameFirestoreId: "98ilau3629VSCnBcDPyz"
    }]
}).then(() => {
    console.log('Event published');
}).catch((err) => {
    console.error('Error publishing event', err);
}).finally(() => {
    process.env['PUBSUB_EMULATOR_HOST'] = oldPUBSUB_EMULATOR_HOST;
})