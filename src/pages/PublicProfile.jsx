import { useParams } from 'react-router-dom'
import { useEffect, useState } from 'react'
import axios from 'axios'
import api from '../api'
import MarketplaceCard from './MarketplaceCard'
import FeedCard from '../components/FeedCard'

function PublicProfile() {
  const { id } = useParams()
  const [info, setInfo] = useState(null)
  const [posts, setPosts] = useState([])
  const [listings, setListings] = useState([])

  useEffect(() => {
    const load = async () => {
      const userRes = await api.get(`${import.meta.env.VITE_API_BASE_URL}users/${id}/`)
      const postRes = await api.get(`${import.meta.env.VITE_API_BASE_URL}posts/?user=${id}`)
      const listingRes = await api.get(`${import.meta.env.VITE_API_BASE_URL}marketplace/`)

      setInfo(userRes.data)
      setPosts(postRes.data)
      setListings(listingRes.data.filter((i) => i.seller === parseInt(id)))
    }

    load()
  }, [id])

  return (
    <div className="max-w-4xl mx-auto p-4">
      {info ? (
        <>
          <h1 className="text-2xl font-bold mb-4">{info.username}'s Profile</h1>
          <p className="mb-6 text-gray-500">City: {info.city}</p>

          <h2 className="text-xl font-semibold mb-2">Posts</h2>
          {posts.length === 0 ? (
            <p>No posts yet.</p>
          ) : (
            posts.map((p) => <FeedCard key={p.id} post={p} />)
          )}

          <h2 className="text-xl font-semibold mt-6 mb-2">Listings</h2>
          {listings.length === 0 ? (
            <p>No marketplace listings yet.</p>
          ) : (
            listings.map((item) => <MarketplaceCard key={item.id} item={item} />)
          )}
        </>
      ) : (
        <p>Loading profile...</p>
      )}
    </div>
  )
}

export default PublicProfile
