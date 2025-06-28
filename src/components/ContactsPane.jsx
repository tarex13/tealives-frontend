// src/components/ContactsPane.jsx
// Not Used
import React, { useCallback } from 'react';
import AutoSizer from 'react-virtualized-auto-sizer';
import InfiniteLoader from 'react-window-infinite-loader';
import { FixedSizeList as List } from 'react-window';
import ThreadItem from './ThreadItem';

function ContactsPane({
  threads,
  activeThread,
  loadMore,
  hasMore,
  isLoadingMore,
  onSelectThread,
}) {
  return (
    <div className="flex-1 overflow-y-auto">
      {threads.length === 0 ? (
        <p className="px-6 py-4 text-center text-gray-400">No conversations</p>
      ) : (
        <AutoSizer>
          {({ height, width }) => (
            <InfiniteLoader
              isItemLoaded={i => !hasMore || i < threads.length}
              itemCount={hasMore ? threads.length + 1 : threads.length}
              loadMoreItems={loadMore}
            >
              {({ onItemsRendered, ref }) => (
                <List
                  height={height}
                  width={width}
                  itemCount={hasMore ? threads.length + 1 : threads.length}
                  itemSize={64}
                  onItemsRendered={onItemsRendered}
                  ref={ref}
                  itemKey={i => {
                    const t = threads[i];
                    return t
                      ? t.type === 'direct'
                        ? `direct-${t.user.id}`
                        : `mp-${t.conversation_id}`
                      : `loading-${i}`;
                  }}
                >
                  {({ index, style }) => {
                    // loading sentinel
                    if (hasMore && index === threads.length) {
                      return (
                        <div style={style} className="p-4 text-center text-gray-400">
                          {isLoadingMore ? 'Loading more…' : 'Load more threads'}
                        </div>
                      );
                    }
                    const t = threads[index];
                    const isActive =
                      activeThread &&
                      t.type === activeThread.type &&
                      ((t.type === 'direct' &&
                        activeThread.user.id === t.user.id) ||
                       (t.type === 'marketplace' &&
                        activeThread.conversation_id === t.conversation_id));
                    return (
                      <ThreadItem
                        key={style.top /* react-window ignores your key; use itemKey above */}
                        style={style}
                        thread={t}
                        isActive={isActive}
                        onClick={() => onSelectThread(t)}
                      />
                    );
                  }}
                </List>
              )}
            </InfiniteLoader>
          )}
        </AutoSizer>
      )}
    </div>
  );
}

export default React.memo(ContactsPane);
