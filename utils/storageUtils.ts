const DB_NAME = 'DesignEditorDB'
const STORE_NAME = 'designs'
const DB_VERSION = 1

export const openDB = (): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION)

        request.onerror = () => reject(request.error)
        request.onsuccess = () => resolve(request.result)

        request.onupgradeneeded = (event) => {
            const db = (event.target as IDBOpenDBRequest).result
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME)
            }
        }
    })
}

export const saveDesignToDB = async (key: string, data: any): Promise<void> => {
    try {
        const db = await openDB()
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([STORE_NAME], 'readwrite')
            const store = transaction.objectStore(STORE_NAME)
            const request = store.put(data, key)

            request.onerror = () => reject(request.error)
            request.onsuccess = () => resolve()
        })
    } catch (error) {
        console.error('IndexedDB save error:', error)
        throw error
    }
}

export const getDesignFromDB = async (key: string): Promise<any> => {
    try {
        const db = await openDB()
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([STORE_NAME], 'readonly')
            const store = transaction.objectStore(STORE_NAME)
            const request = store.get(key)

            request.onerror = () => reject(request.error)
            request.onsuccess = () => resolve(request.result)
        })
    } catch (error) {
        console.error('IndexedDB get error:', error)
        return null
    }
}

export const removeDesignFromDB = async (key: string): Promise<void> => {
    try {
        const db = await openDB()
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([STORE_NAME], 'readwrite')
            const store = transaction.objectStore(STORE_NAME)
            const request = store.delete(key)

            request.onerror = () => reject(request.error)
            request.onsuccess = () => resolve()
        })
    } catch (error) {
        console.error('IndexedDB delete error:', error)
    }
}
