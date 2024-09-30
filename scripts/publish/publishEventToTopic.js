const {PubSub} = require('@google-cloud/pubsub');


async function publishEventToTopic(topicName, event) {
    const pubsub = new PubSub();
    const topic = pubsub.topic(topicName);
    if(!(await topic.exists())[0]) {
        await topic.create();
    }
    return topic.publishMessage({data: Buffer.from(JSON.stringify(event))});
}


publishEventToTopic('CREATE_USER', {test: 'event'}).then(() => {
    console.log('Event published');
}).catch((err) => {
    console.error('Error publishing event', err);
})