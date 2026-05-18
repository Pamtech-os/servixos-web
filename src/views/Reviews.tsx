'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Star, MessageSquare } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import PaginationControls from '@/components/ui/pagination-controls';
import { useReviews, useReviewStats } from '@/hooks/queries/use-reviews';
import type { Review } from '@/lib/api-client';

const ITEMS_PER_PAGE = 10;

const STAR_COLORS: Record<number, string> = {
  5: 'text-yellow-500',
  4: 'text-yellow-400',
  3: 'text-orange-400',
  2: 'text-orange-500',
  1: 'text-red-500',
};

function StarRating({ rating }: { rating: number }) {
  return (
    <div className='flex items-center gap-0.5'>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          size={14}
          className={i < rating ? (STAR_COLORS[rating] ?? 'text-yellow-500') : 'text-muted-foreground/30'}
          fill={i < rating ? 'currentColor' : 'none'}
        />
      ))}
    </div>
  );
}

function StatsSkeleton() {
  return (
    <Card className='card-shadow p-4 sm:p-6'>
      <div className='flex flex-col gap-6 sm:flex-row'>
        <Skeleton className='h-24 w-36 rounded-lg' />
        <div className='flex-1 space-y-2'>
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className='h-5 w-full rounded' />
          ))}
        </div>
      </div>
    </Card>
  );
}

function ReviewStatsCard() {
  const statsQuery = useReviewStats();
  const stats = statsQuery.data;

  if (statsQuery.isLoading) return <StatsSkeleton />;
  if (!stats) return null;

  const stars = [5, 4, 3, 2, 1] as const;

  return (
    <Card className='card-shadow p-4 sm:p-6'>
      <div className='flex flex-col gap-6 sm:flex-row sm:items-center'>
        <div className='flex flex-col items-center justify-center rounded-xl bg-muted/50 px-8 py-4 text-center'>
          <span className='text-4xl font-bold tracking-tight'>
            {stats.average > 0 ? stats.average.toFixed(1) : '—'}
          </span>
          <span className='mt-0.5 text-sm text-muted-foreground'>out of 5</span>
          <StarRating rating={Math.round(stats.average)} />
          <span className='mt-1 text-xs text-muted-foreground'>
            {stats.count} {stats.count === 1 ? 'review' : 'reviews'}
          </span>
        </div>
        <div className='flex-1 space-y-1.5'>
          {stars.map((star) => {
            const count = stats.distribution[String(star) as '1' | '2' | '3' | '4' | '5'] ?? 0;
            const pct = stats.count > 0 ? Math.round((count / stats.count) * 100) : 0;
            return (
              <div key={star} className='flex items-center gap-2 text-sm'>
                <span className='w-8 text-right text-muted-foreground'>{star}★</span>
                <div className='h-2 flex-1 overflow-hidden rounded-full bg-muted'>
                  <div
                    className='h-full rounded-full bg-yellow-400 transition-all duration-500'
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className='w-8 text-xs text-muted-foreground'>{count}</span>
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
}

function ReviewRow({ review, index }: { review: Review; index: number }) {
  return (
    <motion.tr
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
      className='border-b transition-colors hover:bg-muted/50'
    >
      <TableCell>
        <StarRating rating={review.rating} />
      </TableCell>
      <TableCell className='max-w-xs'>
        {review.comment ? (
          <span className='line-clamp-2 text-sm'>{review.comment}</span>
        ) : (
          <span className='text-xs text-muted-foreground'>No comment</span>
        )}
      </TableCell>
      <TableCell>
        <Badge variant='outline' className='font-mono text-xs'>
          {review.jobId.slice(-6)}
        </Badge>
      </TableCell>
    </motion.tr>
  );
}

function ReviewCard({ review, index }: { review: Review; index: number }) {
  return (
    <motion.div
      key={review._id}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
    >
      <Card className='card-shadow p-3'>
        <div className='space-y-1.5'>
          <StarRating rating={review.rating} />
          {review.comment ? (
            <p className='text-sm'>{review.comment}</p>
          ) : (
            <p className='text-xs text-muted-foreground'>No comment</p>
          )}
          <p className='text-xs text-muted-foreground'>
            Job <span className='font-mono'>{review.jobId.slice(-6)}</span>
          </p>
        </div>
      </Card>
    </motion.div>
  );
}

const Reviews = () => {
  const [ratingFilter, setRatingFilter] = useState('all');
  const [page, setPage] = useState(1);

  const reviewsQuery = useReviews({
    rating: ratingFilter !== 'all' ? Number(ratingFilter) : undefined,
    page,
    limit: ITEMS_PER_PAGE,
  });

  const reviewList = reviewsQuery.data?.data ?? [];
  const paginationMeta = reviewsQuery.data?.meta;

  return (
    <div className='space-y-4 sm:space-y-6'>
      <div>
        <h1 className='text-xl font-bold tracking-tight sm:text-2xl'>Reviews</h1>
        <p className='text-sm text-muted-foreground'>Client ratings and feedback for completed jobs</p>
      </div>

      <ReviewStatsCard />

      <div className='flex items-center gap-3'>
        <Select
          value={ratingFilter}
          onValueChange={(v) => {
            setRatingFilter(v);
            setPage(1);
          }}
        >
          <SelectTrigger className='w-full sm:w-[160px]'>
            <SelectValue placeholder='All Ratings' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>All Ratings</SelectItem>
            {[5, 4, 3, 2, 1].map((r) => (
              <SelectItem key={r} value={String(r)}>
                {r} Star{r !== 1 ? 's' : ''}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {reviewsQuery.isLoading ? (
        <div className='space-y-3'>
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className='h-12 rounded-lg' />
          ))}
        </div>
      ) : (
        <>
          <div className='space-y-3 md:hidden'>
            {reviewList.length === 0 ? (
              <Card className='card-shadow p-6 text-center text-sm text-muted-foreground'>
                <MessageSquare className='mx-auto mb-2 h-8 w-8 opacity-40' />
                No reviews found.
              </Card>
            ) : (
              reviewList.map((review, i) => (
                <ReviewCard key={review._id} review={review} index={i} />
              ))
            )}
          </div>

          <Card className='card-shadow hidden overflow-hidden md:block'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className='w-36'>Rating</TableHead>
                  <TableHead>Comment</TableHead>
                  <TableHead className='w-28'>Job</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reviewList.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className='py-10 text-center text-muted-foreground'>
                      <MessageSquare className='mx-auto mb-2 h-8 w-8 opacity-40' /> No reviews found.
                    </TableCell>
                  </TableRow>
                ) : (
                  reviewList.map((review, i) => (
                    <ReviewRow key={review._id} review={review} index={i} />
                  ))
                )}
              </TableBody>
            </Table>
          </Card>

          {paginationMeta && (
            <PaginationControls
              meta={paginationMeta}
              onPageChange={setPage}
              className='flex items-center justify-between gap-2 border-t px-1 py-3 sm:px-2 md:rounded-b-lg md:border md:px-4'
              controlsClassName='flex gap-1'
            />
          )}
        </>
      )}
    </div>
  );
};

export default Reviews;
