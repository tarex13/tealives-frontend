import { Component } from 'react'
import React from 'react'

class ErrorBoundary extends Component {
  constructor() {
    super()
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  render() {
    if (this.state.hasError) {
      return <div className="p-6 text-center">⚠️ Something went wrong. Try refreshing.</div>
    }

    return this.props.children
  }
}

export default ErrorBoundary
