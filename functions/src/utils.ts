import * as admin from 'firebase-admin'
import { DocumentData, WithFieldValue } from 'firebase-admin/firestore'

type Model = {
  id: number | string
  [key: string]: any
}

export async function getDoc<DocType extends Model>(path: string) {
  const docPromise = await admin.firestore().doc(path).get()
  const doc = { id: docPromise.id, ...docPromise.data() }

  return doc as DocType
}

export async function setDoc<DocType extends WithFieldValue<DocumentData>>(
  collectionPath: string,
  data: DocType
) {
  if (data.id) {
    const id = data.id
    delete data.id
    await admin.firestore().doc(`${collectionPath}/${id}`).set(data)
  } else {
    delete data.id
    await admin.firestore().collection(collectionPath).add(data)
  }
}

export async function getCollection<DocType extends Model>(
  collectionPath: string
) {
  const docsPromise = await admin.firestore().collection(collectionPath).get()
  const docs: DocType[] = []
  docsPromise.forEach((doc) => {
    docs.push({ id: doc.id, ...doc.data() } as DocType)
  })

  return docs
}
