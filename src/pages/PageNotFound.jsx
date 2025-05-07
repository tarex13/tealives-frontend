import { Link } from 'react-router-dom'

function PageNotFound() {
  return (
    <div className="h-screen flex flex-col items-center justify-center bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100 p-6">
      <h1 className="text-6xl font-bold mb-4">404</h1>
      <p className="text-xl mb-6">Oops — that page doesn’t exist.</p>
      <Link
        to="/"
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
      >
        Go Home
      </Link>
    </div>
  )
}

export default PageNotFound
