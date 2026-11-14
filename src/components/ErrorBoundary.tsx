import { Component, type ErrorInfo, type ReactNode } from 'react'

/** Last line of defence: a crash shows a way back instead of a blank page. */
export class ErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Peckish crashed', error, info.componentStack)
  }

  render() {
    if (!this.state.failed) return this.props.children
    return (
      <main className="crash" role="alert">
        <h1>That wasn’t supposed to happen.</h1>
        <p>Your streak and scores are safe. Reload to carry on.</p>
        <button type="button" className="primary" onClick={() => location.reload()}>Reload</button>
      </main>
    )
  }
}
