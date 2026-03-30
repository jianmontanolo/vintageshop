import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase'

export function useHistory() {
  const logHistory = async ({ topId, accion, antes = null, despues = null, usuario }) => {
    try {
      await addDoc(collection(db, 'historial'), {
        topId,
        accion,   // 'crear' | 'editar' | 'eliminar' | 'mover'
        antes,
        despues,
        usuario,
        fecha: serverTimestamp(),
      })
    } catch {
      // Never block the main action if history logging fails
    }
  }
  return { logHistory }
}
