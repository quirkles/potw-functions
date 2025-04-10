import {Firestore, CollectionReference, QueryDocumentSnapshot} from "firebase-admin/firestore";

const collectionsToDeleteFrom = [
    "users",
    "games",
    "gameWeeks"
]

const firestore = new Firestore();

async function truncateFirebase() {
    for (const collection of collectionsToDeleteFrom) {
        console.log(`Begin deleting from: ${collection}`)
        await deleteAllInCollection(firestore.collection(collection)).then(() => {
            console.log(`Deleted all from ${collection}`)
        }).catch((err) => {
            console.error(`Error deleting from ${collection}: ${err}`)
        })
    }
}

async function deleteAllInCollection(collectionRef: CollectionReference): Promise<void> {
    console.log((`Deleting all documents in ${collectionRef.path}`))
    const stream = collectionRef.stream()

    let streaming = true;
    let count = 0;

    stream.on(
        'data',
        (doc: QueryDocumentSnapshot) => {
            console.log("doc")
            count += 1;
            doc.ref.listCollections().then((collections) => {
                console.log(`Found ${collections.length} subcollections in ${doc.ref.path}`)
                return Promise.all(
                    collections.map(collection => deleteAllInCollection(collection))
                ).then(() => {
                    doc.ref.delete()
                }).finally(() => {
                    count -= 1;
                })
            })
        })

    stream.on('error', (err) => {
        throw err
    })

    stream.on('end', () => {
        streaming = false;
    })

    while (streaming || count > 0) {
        await new Promise(resolve => setTimeout(resolve, 1000))
    }

    console.log(`Deleted all documents in ${collectionRef.path}`)

    return

}

truncateFirebase()
    .then(() => console.log('done'))
    .catch((err) => {
        console.log("Error")
        console.error(err);
    })