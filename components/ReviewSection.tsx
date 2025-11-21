"use client";

import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { Star } from "lucide-react";
import { Review, ReviewApiResponse } from "@/types";

interface ReviewSectionProps {
  serviceType: "robux" | "gamepass" | "joki";
  serviceCategory?: "robux_instant" | "robux_5_hari";
  serviceId?: string;
  serviceName?: string;
  title?: string;
}

export default function ReviewSection({
  serviceType,
  serviceCategory,
  serviceId,
  serviceName,
  title = "Reviews & Testimonials",
}: ReviewSectionProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [username, setUsername] = useState("");
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [localHoverRating, setLocalHoverRating] = useState(0);
  useEffect(() => {
    fetchReviews();
  }, [serviceType, serviceCategory, serviceId]);

  const fetchReviews = async () => {
    try {
      const params = new URLSearchParams({
        serviceType,
        limit: "10",
      });

      if (serviceCategory) params.append("serviceCategory", serviceCategory);
      if (serviceId) params.append("serviceId", serviceId);

      const response = await fetch(`/api/reviews?${params}`);
      const data: ReviewApiResponse = await response.json();

      if (data.success && data.data) {
        setReviews(data.data);
      }
    } catch (error) {
      console.error("Error fetching reviews:", error);
    } finally {
      setLoading(false);
    }
  };

  const submitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !comment.trim()) {
      toast.error("Username dan comment wajib diisi");
      return;
    }

    setSubmitting(true);
    try {
      const payload: any = {
        username: username.trim(),
        serviceType,
        rating,
        comment: comment.trim(),
      };

      if (serviceType === "robux" && serviceCategory) {
        payload.serviceCategory = serviceCategory;
      }

      if (
        (serviceType === "gamepass" || serviceType === "joki") &&
        serviceId &&
        serviceName
      ) {
        payload.serviceId = serviceId;
        payload.serviceName = serviceName;
      }

      const response = await fetch("/api/reviews", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Review berhasil dikirim dan menunggu persetujuan admin");
        setUsername("");
        setRating(5);
        setComment("");
        setShowForm(false);
        fetchReviews();
      } else {
        toast.error(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error("Error submitting review:", error);
      toast.error("Terjadi kesalahan saat mengirim review");
    } finally {
      setSubmitting(false);
    }
  };

  // Component untuk Stars yang Interaktif (untuk form)
  const InteractiveStars = ({
    rating,
    onRate,
  }: {
    rating: number;
    onRate: (rating: number) => void;
  }) => {
    const [hoverRating, setHoverRating] = useState(0);
    const currentRating = hoverRating || rating;

    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => {
          const isFilled = star <= currentRating;

          return (
            <button
              key={star}
              type="button"
              className="cursor-pointer hover:scale-110 active:scale-95 transition-all duration-200"
              onClick={() => {
                onRate(star);
                setHoverRating(0);
              }}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              title={`Rating ${star} dari 5`}
            >
              <Star
                size={24}
                className={`transition-colors duration-200 ${
                  isFilled
                    ? "fill-yellow-400 text-yellow-400"
                    : "fill-none text-gray-400 hover:text-yellow-300"
                }`}
              />
            </button>
          );
        })}
      </div>
    );
  };

  // Component untuk Stars yang Static (untuk display)
  const StaticStars = ({ rating }: { rating: number }) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => {
          const isFilled = star <= rating;

          return (
            <Star
              key={star}
              size={24}
              className={`transition-colors duration-200 ${
                isFilled
                  ? "fill-yellow-400 text-yellow-400"
                  : "fill-none text-gray-400"
              }`}
            />
          );
        })}
      </div>
    );
  };

  const getAverageRating = (): number => {
    if (reviews.length === 0) return 0;
    const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
    return sum / reviews.length;
  };

  return (
    <div className="bg-gradient-to-br from-primary-900/40 via-primary-800/30 to-primary-700/40 backdrop-blur-xl border border-primary-100/30 rounded-xl p-6 mt-8 shadow-lg transition-all duration-300 overflow-hidden relative">
      {/* Background decorative elements */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary-100/5 via-transparent to-primary-200/5 rounded-xl"></div>
      <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-gradient-to-tr from-primary-200/10 to-primary-100/5 rounded-full blur-2xl"></div>

      <div className="relative z-10">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
          <div className="flex-1">
            <h3 className="text-2xl sm:text-3xl font-black text-white mb-3 leading-tight">
              <span className="text-white/80">{title}</span>
            </h3>
            {reviews.length > 0 && (
              <div className="flex items-center gap-3">
                <StaticStars rating={Math.round(getAverageRating())} />
                <span className="text-white/80 text-sm font-medium">
                  {getAverageRating().toFixed(1)} dari 5 ({reviews.length}{" "}
                  review
                  {reviews.length > 1 ? "s" : ""})
                </span>
              </div>
            )}
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-gradient-to-r from-primary-100 to-primary-200 text-white/80 px-6 py-3 rounded-xl font-semibold hover:scale-105 transition-all duration-300 shadow-md hover:shadow-lg hover:shadow-primary-100/20"
          >
            {showForm ? "Tutup" : "Tulis Review"}
          </button>
        </div>
      </div>

      {/* Review Form */}
      {showForm && (
        <div className="relative z-10 mb-6">
          <form
            onSubmit={submitReview}
            className="bg-gradient-to-br from-white/10 via-white/5 to-transparent border border-white/20 p-6 rounded-xl backdrop-blur-sm"
          >
            <h4 className="font-bold mb-6 text-white text-lg">
              Tulis Review Anda
            </h4>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold mb-3 text-white">
                  Username
                  <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-4 py-3 border border-primary-100/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-100/50 focus:border-primary-100/80 bg-gradient-to-r from-primary-900/50 to-primary-800/50 backdrop-blur-sm text-white placeholder-white/50 transition-all"
                  placeholder="Masukkan username Anda"
                  required
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-semibold mb-3 text-white">
                  Rating
                  <span className="text-red-400">*</span>
                </label>
                <div className="pt-1 pb-2">
                  <div className="flex items-center gap-3">
                    <InteractiveStars rating={rating} onRate={setRating} />
                    <div className="flex flex-col">
                      <span className="text-white/80 text-sm font-bold">
                        {rating}/5
                      </span>
                      <span className="text-white/50 text-xs">
                        {rating === 5
                          ? "Sangat Baik"
                          : rating === 4
                          ? "Baik"
                          : rating === 3
                          ? "Cukup"
                          : rating === 2
                          ? "Kurang"
                          : "Buruk"}
                      </span>
                    </div>
                  </div>
                  <p className="text-white/50 text-xs mt-2 flex items-center gap-1">
                    <span>👆</span>
                    Klik bintang untuk memberi rating
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-5">
              <label className="flex items-center gap-2 text-sm font-semibold mb-3 text-white">
                Komentar
                <span className="text-red-400">*</span>
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={4}
                className="w-full px-4 py-3 border border-primary-100/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-100/50 focus:border-primary-100/80 bg-gradient-to-br from-primary-900/50 to-primary-800/50 backdrop-blur-sm text-white placeholder-white/50 transition-all resize-none"
                placeholder="Bagikan pengalaman Anda menggunakan layanan kami..."
                required
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-3 mt-6">
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 bg-gradient-to-r from-primary-100 to-primary-200 text-white/80 px-6 py-3 rounded-xl font-semibold hover:scale-[1.01] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all duration-300"
              >
                {submitting ? "Mengirim..." : "Kirim Review"}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="bg-gradient-to-r from-white/20 to-white/10 border border-white/30 text-white px-6 py-3 rounded-xl font-semibold hover:from-white/30 hover:to-white/20 transition-all duration-300"
              >
                Batal
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Review List */}
      <div className="relative z-10">
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-12">
              <div className="relative">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-transparent border-t-primary-100 border-r-primary-100"></div>
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-primary-100/20 to-primary-200/20 blur-sm"></div>
              </div>
              <p className="text-white/70 mt-3 font-medium">Memuat review...</p>
            </div>
          ) : reviews.length > 0 ? (
            reviews.map((review) => (
              <div
                key={review._id}
                className="group bg-gradient-to-br from-white/8 via-white/4 to-transparent border border-white/15 p-5 rounded-xl backdrop-blur-sm hover:border-primary-100/30 transition-all duration-300"
              >
                <div className="flex items-start gap-4">
                  {/* Avatar */}
                  <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-orange-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-bold text-lg">
                      {review.username.charAt(0).toUpperCase()}
                    </span>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    {/* Header dengan username, verified badge, dan timestamp */}
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-white text-base">
                          {review.username}
                        </h4>
                      </div>
                      <span className="text-xs text-white/60">
                        {(() => {
                          const reviewDate = new Date(review.createdAt);
                          const now = new Date();
                          const diffTime = Math.abs(
                            now.getTime() - reviewDate.getTime()
                          );
                          const diffDays = Math.ceil(
                            diffTime / (1000 * 60 * 60 * 24)
                          );

                          if (diffDays === 1) return "1 hari yang lalu";
                          if (diffDays < 7) return `${diffDays} hari yang lalu`;
                          if (diffDays < 30)
                            return `${Math.ceil(
                              diffDays / 7
                            )} minggu yang lalu`;
                          return `${Math.ceil(diffDays / 30)} bulan yang lalu`;
                        })()}
                      </span>
                    </div>

                    {/* Rating bintang */}
                    <div className="flex items-center mb-3">
                      <StaticStars rating={review.rating} />
                    </div>

                    {/* Komentar */}
                    <p className="text-white/85 leading-relaxed text-sm">
                      {review.comment}
                    </p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-primary-100/20 to-primary-200/10 rounded-full flex items-center justify-center">
                <span className="text-primary-100 text-2xl -mt-1">�</span>
              </div>
              <p className="text-white/70 font-medium">
                Belum ada review untuk layanan ini.
              </p>
              <p className="text-white/50 text-sm mt-2">
                Jadilah yang pertama memberikan review!
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
