import { useEffect, useState } from 'react'
import { fetchListings } from '../api/marketplace'
import MarketplaceCard from './MarketplaceCard'
import { useAuth } from '../context/AuthContext'
import CreateListing from '../components/CreateListing'


function Marketplace() {
  const [listings, setListings] = useState([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchListings()
        const filtered = data.filter(item => item.status === 'available' && item.listing_location === user?.city)
        setListings(filtered)
      } catch (err) {
        console.error('Failed to load listings:', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [user])

  return (
    <div className="max-w-3xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Marketplace</h1>
      {user && (
    <CreateListing onListingCreated={(newItem) => setListings([newItem, ...listings])} />
  )}
      {loading ? (
        <p>Loading listings...</p>
      ) : listings.length === 0 ? (
        <p>No items available in your area.</p>
      ) : (
        
        listings.map((item) => <MarketplaceCard key={item.id} item={item} />)
      )}
    </div>
  )
}

export default Marketplace
