
'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { AlertCircle, RefreshCcw } from 'lucide-react'

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    useEffect(() => {
        // Log the error to an error reporting service
        console.error('Unhandled Application Error:', error)
    }, [error])

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
            <div className="max-w-md w-full text-center space-y-6 bg-white p-8 rounded-2xl shadow-xl border border-slate-100">
                <div className="bg-red-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto">
                    <AlertCircle className="w-8 h-8 text-red-500" />
                </div>

                <div className="space-y-2">
                    <h2 className="text-2xl font-bold text-slate-900">Something went wrong!</h2>
                    <p className="text-slate-500 text-sm">
                        We encountered an unexpected error. Don't worry, your data is safe.
                    </p>
                </div>

                <div className="bg-slate-50 p-4 rounded-lg text-left overflow-auto max-h-32">
                    <p className="font-mono text-xs text-slate-600 break-words">
                        {error.message || "Unknown error"}
                    </p>
                </div>

                <div className="flex gap-4 items-center justify-center">
                    <Button
                        onClick={() => reset()}
                        className="bg-slate-900 hover:bg-slate-800"
                    >
                        <RefreshCcw className="w-4 h-4 mr-2" />
                        Try again
                    </Button>
                    <Button
                        variant="ghost"
                        onClick={() => window.location.href = '/'}
                    >
                        Go to Home
                    </Button>
                </div>
            </div>
        </div>
    )
}
