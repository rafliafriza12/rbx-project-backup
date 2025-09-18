"use client";

import { useState, useEffect } from "react";
import { toast } from "react-toastify";
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

  const renderStars = (
    rating: number,
    interactive = false,
    onRate?: (rating: number) => void
  ) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <span
            key={star}
            className={`text-xl cursor-pointer transition-colors ${
              star <= rating ? "text-yellow-400" : "text-rose-300"
            } ${interactive ? "hover:text-yellow-400" : ""}`}
            onClick={() => interactive && onRate && onRate(star)}
          >
            ⭐
          </span>
        ))}
      </div>
    );
  };

  const getAverageRating = (): number => {
    if (reviews.length === 0) return 0;
    const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
    return sum / reviews.length;
  };

  return (
    <div className="bg-white/50 backdrop-blur-sm rounded-xl shadow-xl border border-rose-200 p-6 mt-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-2xl font-bold text-gray-800 mb-2">{title}</h3>
          {reviews.length > 0 && (
            <div className="flex items-center gap-3">
              {renderStars(Math.round(getAverageRating()))}
              <span className="text-gray-700">
                {getAverageRating().toFixed(1)} dari 5 ({reviews.length} review
                {reviews.length > 1 ? "s" : ""})
              </span>
            </div>
          )}
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-red-500 text-white px-6 py-3 rounded-lg hover:bg-red-500/90 transition-all duration-300 transform hover:scale-105 shadow-lg"
        >
          {showForm ? "Tutup" : "Tulis Review"}
        </button>
      </div>

      {/* Review Form */}
      {showForm && (
        <form
          onSubmit={submitReview}
          className="bg-gradient-to-r from-rose-50 to-pink-50 border border-rose-200 p-6 rounded-xl mb-6 shadow-sm"
        >
          <h4 className="font-semibold mb-4 text-gray-800">
            Tulis Review Anda
          </h4>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 border border-rose-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent bg-white/80 backdrop-blur-sm"
              placeholder="Masukkan username Anda"
              required
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rating
            </label>
            {renderStars(rating, true, setRating)}
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Comment
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
              className="w-full px-4 py-3 border border-rose-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent bg-white/80 backdrop-blur-sm"
              placeholder="Bagikan pengalaman Anda..."
              required
            />
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={submitting}
              className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-6 py-3 rounded-lg hover:from-green-600 hover:to-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-md"
            >
              {submitting ? "Mengirim..." : "Kirim Review"}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="bg-gradient-to-r from-gray-500 to-gray-600 text-white px-6 py-3 rounded-lg hover:from-gray-600 hover:to-gray-700 transition-all duration-300 shadow-md"
            >
              Batal
            </button>
          </div>
        </form>
      )}

      {/* Reviews List */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-rose-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading reviews...</p>
          </div>
        ) : reviews.length > 0 ? (
          reviews.map((review) => (
            <div
              key={review._id}
              className="bg-white/70 backdrop-blur-sm border border-rose-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-all duration-300"
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <strong className="text-gray-800 font-semibold">
                      {review.username}
                    </strong>
                    {renderStars(review.rating)}
                  </div>
                  {review.serviceName && (
                    <p className="text-sm text-rose-600 font-medium">
                      Service: {review.serviceName}
                    </p>
                  )}
                </div>
                <span className="text-sm text-gray-500 bg-rose-50 px-3 py-1 rounded-full">
                  {new Date(review.createdAt).toLocaleDateString("id-ID")}
                </span>
              </div>
              <p className="text-gray-700 leading-relaxed">{review.comment}</p>
            </div>
          ))
        ) : (
          <div className="text-center py-12 bg-gradient-to-r from-rose-50 to-pink-50 rounded-xl border border-rose-200">
            <div className="text-6xl mb-4">💭</div>
            <p className="text-gray-600 mb-2 font-medium">
              Belum ada review untuk service ini
            </p>
            <p className="text-sm text-gray-500">
              Jadilah yang pertama memberikan review!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
