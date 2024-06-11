import * as admin from 'firebase-admin'
import { DocumentData, WithFieldValue } from 'firebase-admin/firestore'

export type Model = {
  id: number | string
  [key: string]: any
}

export type filter = [
  string | admin.firestore.FieldPath,
  admin.firestore.WhereFilterOp,
  any
]

export async function getDoc<DocType extends Model>(
  path: string,
  filters: filter[] = []
) {
  if (filters.length > 0) {
    const docs = await getCollection<DocType>(path, filters)

    if (docs.length != 1) throw Error('Document Not Found')

    return docs[0]
  } else {
    const docPromise = await admin.firestore().doc(path).get()
    const doc = { id: docPromise.id, ...docPromise.data() }

    return doc as DocType
  }
}

export async function setDoc<DocType extends WithFieldValue<DocumentData>>(
  collectionPath: string,
  data: DocType
) {
  const copyData = { ...data }
  if (copyData.id) {
    const id = copyData.id
    delete copyData.id
    await admin.firestore().doc(`${collectionPath}/${id}`).set(copyData)
    return copyData.id as string
  } else {
    delete copyData.id
    const newData = await admin
      .firestore()
      .collection(collectionPath)
      .add(copyData)
    return newData.id
  }
}

export async function deleteDoc(path: string) {
  await admin.firestore().doc(path).delete()
}

export async function getCollection<DocType extends Model>(
  collectionPath: string,
  filters: filter[] = []
) {
  let docsQuery: admin.firestore.Query<admin.firestore.DocumentData> = admin
    .firestore()
    .collection(collectionPath)

  if (filters.length > 0) {
    filters.forEach((filter) => {
      docsQuery = docsQuery.where(...filter)
    })
  }

  const docsPromise = await docsQuery.get()
  const docs: DocType[] = []
  docsPromise.forEach((doc) => {
    docs.push({ id: doc.id, ...doc.data() } as DocType)
  })

  return docs
}
