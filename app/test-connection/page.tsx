"use client"

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function TestConnectionPage() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')
  const [envVars, setEnvVars] = useState<any>({})

  useEffect(() => {
    const testConnection = async () => {
      try {
        // Check environment variables
        const env = {
          hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
          hasKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
          url: process.env.NEXT_PUBLIC_SUPABASE_URL,
          keyLength: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.length || 0
        }
        setEnvVars(env)

        if (!env.hasUrl || !env.hasKey) {
          setStatus('error')
          setMessage('Missing environment variables')
          return
        }

        // Test Supabase connection
        const { data, error } = await supabase.from('users').select('count').limit(1)
        
        if (error) {
          setStatus('error')
          setMessage(`Supabase error: ${error.message}`)
        } else {
          setStatus('success')
          setMessage('Supabase connection successful!')
        }
      } catch (error: any) {
        setStatus('error')
        setMessage(`Connection error: ${error.message}`)
      }
    }

    testConnection()
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold mb-4">Connection Test</h1>
        
        <div className="space-y-4">
          <div>
            <h2 className="font-semibold mb-2">Environment Variables:</h2>
            <div className="bg-gray-100 p-3 rounded text-sm">
              <div>Has URL: {envVars.hasUrl ? '✅' : '❌'}</div>
              <div>Has Key: {envVars.hasKey ? '✅' : '❌'}</div>
              <div>URL: {envVars.url || 'Not set'}</div>
              <div>Key Length: {envVars.keyLength}</div>
            </div>
          </div>

          <div>
            <h2 className="font-semibold mb-2">Connection Status:</h2>
            <div className={`p-3 rounded ${
              status === 'loading' ? 'bg-yellow-100 text-yellow-800' :
              status === 'success' ? 'bg-green-100 text-green-800' :
              'bg-red-100 text-red-800'
            }`}>
              {status === 'loading' && '🔄 Testing connection...'}
              {status === 'success' && '✅ ' + message}
              {status === 'error' && '❌ ' + message}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
