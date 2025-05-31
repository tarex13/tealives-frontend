import React from 'react';
import EventCard from './EventCard';

function EventCarousel({ events }) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg shadow-md p-4 mb-6">
      <h2 className="text-lg font-bold mb-3 text-blue-600 dark:text-blue-300">
        🎉 Upcoming Events in Your City
      </h2>

      <div className="overflow-x-auto">
        <div className="flex gap-4 pb-2">
          {events.slice(0, 6).map((event) => (
            <div
              key={event.id}
              className="min-w-[280px] max-w-[300px] w-full flex-shrink-0"
            >
              <EventCard event={event} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default EventCarousel;
