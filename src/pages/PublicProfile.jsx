import { useParams } from 'react-router-dom'
import { useEffect, useState } from 'react'
import api from '../api'
import React from 'react'
import MarketplaceCard from './MarketplaceCard'
import FeedCard from '../components/FeedCard'

function PublicProfile() {
  const { id } = useParams()
  const [info, setInfo] = useState(null)
  const [posts, setPosts] = useState([])
  const [listings, setListings] = useState([])

  useEffect(() => {
    const loadContent = async () => {
      try {
        const [userData, postsData, listingsData] = await Promise.all([
          api.get(`user/public/${id}/`),
          api.get(`posts/?user_id=${id}`),
          api.get(`marketplace/?seller_id=${id}`)
        ])
        setInfo(userData.data)
        setPosts(postsData.data)
        setListings(listingsData.data)
      } catch (error) {
        console.error('Error loading profile data:', error)
      }
    }
    loadContent()
  }, [id])

  return (
    <div className="max-w-4xl mx-auto p-4">
      {info ? (
        <>
          <h1 className="text-2xl font-bold mb-4">{info.username}'s Profile</h1>
          <p className="mb-6 text-gray-500">City: {info.city}</p>   
          <p className="mt-2">{info.bio}</p>

          <h2 className="text-xl font-semibold mb-2 mt-4">Posts</h2>
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
