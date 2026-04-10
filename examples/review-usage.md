# Review System Usage Examples

## Review Model Structure

Sekarang model review sudah mendukung:

- **serviceId**: ID dari joki atau gamepass yang direview
- **serviceName**: Nama joki atau gamepass yang direview

## API Usage Examples

### 1. Create Review for Gamepass

```javascript
// POST /api/reviews
{
  "username": "johndoe",
  "serviceType": "gamepass",
  "serviceId": "64f123abc456def789012345", // ID gamepass dari database
  "serviceName": "Blox Fruits Premium Pass",
  "rating": 5,
  "comment": "Gamepass berfungsi dengan baik, sangat puas!"
}
```

### 2. Create Review for Joki

```javascript
// POST /api/reviews
{
  "username": "janedoe",
  "serviceType": "joki",
  "serviceId": "64f789def012abc345678901", // ID joki dari database
  "serviceName": "King Legacy Joki Level 2450",
  "rating": 4,
  "comment": "Joki cepat dan aman, hanya butuh 2 hari untuk selesai"
}
```

### 3. Create Review for Robux

```javascript
// POST /api/reviews
{
  "username": "user123",
  "serviceType": "robux",
  "serviceCategory": "robux_5_hari",
  "rating": 5,
  "comment": "Robux masuk dalam 3 hari, pelayanan memuaskan"
}
```

## Query Examples

### 1. Get Reviews for Specific Gamepass

```javascript
// GET /api/reviews?serviceType=gamepass&serviceId=64f123abc456def789012345
```

### 2. Get Reviews for Specific Joki

```javascript
// GET /api/reviews?serviceType=joki&serviceId=64f789def012abc345678901
```

### 3. Get Reviews for Robux 5 Hari

```javascript
// GET /api/reviews?serviceType=robux&serviceCategory=robux_5_hari
```

### 4. Get All Gamepass Reviews

```javascript
// GET /api/reviews?serviceType=gamepass
```

### 5. Get All Joki Reviews

```javascript
// GET /api/reviews?serviceType=joki
```

## Frontend Implementation Example

```tsx
// components/ReviewSection.tsx
import { useState, useEffect } from "react";
import { Review, ReviewApiResponse } from "@/types";

interface ReviewSectionProps {
  serviceType: "robux" | "gamepass" | "joki";
  serviceCategory?: "robux_instant" | "robux_5_hari";
  serviceId?: string; // Required for gamepass and joki
  serviceName?: string; // Required for gamepass and joki
}

export default function ReviewSection({
  serviceType,
  serviceCategory,
  serviceId,
  serviceName,
}: ReviewSectionProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReviews();
  }, [serviceType, serviceCategory, serviceId]);

  const fetchReviews = async () => {
    try {
      const params = new URLSearchParams({
        serviceType,
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

  const submitReview = async (
    rating: number,
    comment: string,
    username: string
  ) => {
    try {
      const payload: any = {
        username,
        serviceType,
        rating,
        comment,
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
        alert("Review berhasil dikirim dan menunggu persetujuan admin");
        // Optionally refresh reviews
        fetchReviews();
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error("Error submitting review:", error);
      alert("Terjadi kesalahan saat mengirim review");
    }
  };

  return (
    <div className="review-section">
      <h3>Reviews</h3>

      {/* Review Form */}
      <div className="review-form">{/* Form implementation here */}</div>

      {/* Reviews List */}
      <div className="reviews-list">
        {loading ? (
          <p>Loading reviews...</p>
        ) : reviews.length > 0 ? (
          reviews.map((review) => (
            <div key={review._id} className="review-item">
              <div className="review-header">
                <strong>{review.username}</strong>
                <div className="rating">
                  {Array.from({ length: review.rating }, (_, i) => (
                    <span key={i}>⭐</span>
                  ))}
                </div>
              </div>
              <p>{review.comment}</p>
              {review.serviceName && (
                <small>Service: {review.serviceName}</small>
              )}
              <small>{new Date(review.createdAt).toLocaleDateString()}</small>
            </div>
          ))
        ) : (
          <p>Belum ada review</p>
        )}
      </div>
    </div>
  );
}
```

## Database Structure

Model sekarang mendukung:

```typescript
{
  username: string;
  serviceType: 'robux' | 'gamepass' | 'joki';
  serviceCategory?: 'robux_instant' | 'robux_5_hari'; // Only for robux
  serviceId?: string; // For gamepass and joki
  serviceName?: string; // For gamepass and joki
  rating: number; // 1-5
  comment: string;
  isApproved: boolean; // Default false
  createdAt: Date;
  updatedAt: Date;
}
```

## Benefits

1. **Specific Reviews**: Reviews sekarang terikat pada joki atau gamepass tertentu
2. **Better Organization**: Bisa filter review berdasarkan service yang spesifik
3. **User Experience**: User bisa lihat review untuk produk yang akan mereka beli
4. **Analytics**: Admin bisa track performa setiap joki/gamepass berdasarkan rating
