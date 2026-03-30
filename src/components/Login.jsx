import { useState } from 'react'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { auth } from '../firebase'
import { useLanguage } from '../context/LanguageContext'

export default function Login() {
  const { lang, toggleLang, t, flags, labels, langs } = useLanguage()
  const nextLang = langs[(langs.indexOf(lang) + 1) % langs.length]
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await signInWithEmailAndPassword(auth, email, password)
    } catch (err) {
      const messages = {
        'auth/user-not-found': t('login', 'errNotFound'),
        'auth/wrong-password': t('login', 'errWrongPass'),
        'auth/invalid-email': t('login', 'errInvalidEmail'),
        'auth/too-many-requests': t('login', 'errTooMany'),
        'auth/invalid-credential': t('login', 'errInvalidCred'),
      }
      setError(messages[err.code] || t('login', 'errGeneral'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm animate-slide-up">
        {/* Logo + language toggle */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="flex justify-end mb-2">
            <button
              onClick={toggleLang}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 rounded-full text-xs font-semibold text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 shadow-sm"
            >
              <span className="text-base leading-none">{flags[nextLang]}</span>
              {labels[nextLang]}
            </button>
          </div>
          <div className="inline-flex items-center justify-center w-16 h-16 bg-brand rounded-2xl mb-4 shadow-lg">
            <svg className="w-9 h-9 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">TOP Inventory</h1>
          <p className="text-sm text-gray-500 mt-1">{t('login', 'subtitle')}</p>
        </div>

        {/* Card */}
        <div className="card p-6 animate-slide-up delay-100">
          <h2 className="text-lg font-semibold text-gray-800 mb-6">{t('login', 'signIn')}</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">{t('login', 'email')}</label>
              <input
                type="email"
                className="input"
                placeholder={t('login', 'emailPlaceholder')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
              />
            </div>
            <div>
              <label className="label">{t('login', 'password')}</label>
              <input
                type="password"
                className="input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-100 text-red-600 text-sm rounded-lg px-3 py-2 animate-slide-up">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2 py-2.5"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  {t('login', 'signingIn')}
                </>
              ) : t('login', 'signIn')}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6 animate-fade-in delay-200">
          {t('login', 'onlyStaff')}
        </p>
      </div>
    </div>
  )
}
