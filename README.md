# Technical Algorithms Documentation

## Table of Contents
1. [Google Maps Route Optimization Algorithm](#google-maps-route-optimization-algorithm)
2. [Recommended Products Algorithm](#recommended-products-algorithm)
3. [Distance Calculation (Haversine Formula)](#distance-calculation-haversine-formula)

---

## Google Maps Route Optimization Algorithm

### Overview
Our application implements a **Dijkstra-like route optimization algorithm** that finds the optimal path between two geographic points. While Google Maps API handles the actual pathfinding internally (which uses Dijkstra's algorithm), our implementation adds an **intelligent route selection layer** that evaluates multiple route alternatives and selects the best one based on weighted criteria.

### Algorithm Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    Route Optimization Flow                    │
└─────────────────────────────────────────────────────────────┘

1. Request Multiple Routes
   │
   ├─> Google Maps API (with alternatives=true)
   │   ├─> Route 1: [Duration, Distance, Traffic]
   │   ├─> Route 2: [Duration, Distance, Traffic]
   │   └─> Route 3: [Duration, Distance, Traffic]
   │
2. Parse Route Information
   │
   ├─> Extract for each route:
   │   ├─> Total Duration (seconds)
   │   ├─> Duration in Traffic (seconds)
   │   ├─> Total Distance (meters)
   │   └─> Traffic Delay (difference)
   │
3. Calculate Route Score (Weighted Scoring)
   │
   ├─> Normalize each metric:
   │   ├─> Duration Score = (duration / maxDuration) × 0.5
   │   ├─> Traffic Score = (trafficDelay / maxTrafficDelay) × 0.3
   │   └─> Distance Score = (distance / maxDistance) × 0.2
   │
   └─> Total Score = Duration + Traffic + Distance
   
4. Select Best Route
   │
   └─> Route with LOWEST score wins
```

### Implementation Details

#### 1. Route Request (`getRoutePolyline`)

**Purpose**: Request multiple route alternatives from Google Maps API with real-time traffic data.

**Key Parameters**:
- `alternatives=true`: Requests multiple route options
- `departure_time=now`: Uses current time for traffic-aware routing
- `traffic_model=best_guess`: Uses Google's best guess for traffic conditions

**Code Location**: `lib/features/pharmacy/presentation/services/directions_service.dart:65-135`

```dart
// Request multiple route alternatives
final url = Uri.parse(
  'https://maps.googleapis.com/maps/api/directions/json?'
  'origin=${origin.latitude},${origin.longitude}'
  '&destination=${destination.latitude},${destination.longitude}'
  '&departure_time=$now'           // Real-time traffic
  '&traffic_model=best_guess'      // Traffic prediction
  '&alternatives=true'              // Get multiple routes
  '&key=$key',
);
```

#### 2. Route Information Parsing (`_parseRouteInfo`)

**Purpose**: Extract key metrics from each route for comparison.

**Metrics Extracted**:
- **Duration**: Total travel time without traffic
- **Duration in Traffic**: Actual travel time with current traffic
- **Distance**: Total route distance in meters
- **Traffic Delay**: Difference between traffic and normal duration

**Code Location**: `lib/features/pharmacy/presentation/services/directions_service.dart:10-40`

```dart
// Aggregates data from all route legs
for (var leg in legs) {
  totalDuration += leg['duration']['value'];
  totalDurationInTraffic += leg['duration_in_traffic']['value'];
  totalDistance += leg['distance']['value'];
}
```

#### 3. Route Scoring Algorithm (`_calculateRouteScore`)

**Purpose**: Calculate a weighted score for each route (lower is better).

**Scoring Formula**:
```
Score = (Duration × 0.5) + (Traffic × 0.3) + (Distance × 0.2)
```

**Weight Distribution**:
- **Duration (50%)**: Most important - users care about time
- **Traffic Delay (30%)**: Important - avoids congested routes
- **Distance (20%)**: Less important - but still considered

**Normalization**:
- All values normalized to 0-1 range using maximum reasonable values
- Prevents any single metric from dominating

**Code Location**: `lib/features/pharmacy/presentation/services/directions_service.dart:42-60`

```dart
// Normalize and weight each factor
final durationScore = (duration / maxDuration) * 0.5;      // 50%
final trafficScore = (trafficDelay / maxTrafficDelay) * 0.3; // 30%
final distanceScore = (distance / maxDistance) * 0.2;       // 20%

return durationScore + trafficScore + distanceScore;
```

#### 4. Route Selection (Dijkstra-like Comparison)

**Purpose**: Compare all routes and select the optimal one.

**Algorithm**:
1. Initialize `bestScore = infinity`
2. For each route:
   - Calculate score
   - If score < bestScore:
     - Update bestScore
     - Mark as bestRoute
3. Return bestRoute

**Code Location**: `lib/features/pharmacy/presentation/services/directions_service.dart:103-120`

```dart
Map<String, dynamic>? bestRoute;
double bestScore = double.infinity;

for (var route in routes) {
  final routeInfo = _parseRouteInfo(route);
  final score = _calculateRouteScore(routeInfo);
  
  if (score < bestScore) {
    bestScore = score;
    bestRoute = route;
  }
}
```

### Why This is Similar to Dijkstra's Algorithm

**Dijkstra's Algorithm** finds the shortest path in a graph by:
1. Starting from source node
2. Exploring all neighbors
3. Calculating distances/costs
4. Selecting the path with minimum cost
5. Repeating until destination is reached

**Our Implementation** mirrors this by:
1. Starting with multiple route alternatives (like exploring multiple paths)
2. Calculating costs (route scores) for each alternative
3. Comparing all routes (like Dijkstra's comparison step)
4. Selecting minimum cost route (like Dijkstra's selection)

**Key Difference**: 
- Dijkstra explores paths **during** pathfinding
- We evaluate paths **after** Google Maps generates them
- Both use the same principle: **minimize cost/score**

### Polyline Decoding

**Purpose**: Convert Google's encoded polyline string to geographic coordinates.

**Algorithm**: Google's Polyline Encoding Algorithm
- Uses base64-like encoding with offset
- Each coordinate is delta-encoded (relative to previous)
- Efficient compression for route data

**Code Location**: `lib/features/pharmacy/presentation/services/directions_service.dart:172-203`

### Time Complexity

- **Route Request**: O(1) - Single API call
- **Route Parsing**: O(n) where n = number of legs/steps
- **Route Scoring**: O(m) where m = number of route alternatives
- **Route Selection**: O(m) - Linear scan through alternatives

**Overall**: O(n + m) - Efficient for typical use cases

### Space Complexity

- **Route Storage**: O(p) where p = number of polyline points
- **Temporary Variables**: O(1) - Constant space

---

## Recommended Products Algorithm

### Overview
Our recommendation system uses a **Collaborative Filtering** approach combined with **Content-Based Filtering**. It analyzes user purchase history and calculates similarity scores between purchased medicines and candidate products to generate personalized recommendations.

### Algorithm Flow

```
┌─────────────────────────────────────────────────────────────┐
│              Product Recommendation Flow                      │
└─────────────────────────────────────────────────────────────┘

1. Collect User Purchase History
   │
   ├─> Filter completed/delivered orders
   ├─> Extract medicines (Vitamins & Supplements, Health Essentials)
   └─> Remove duplicates
   │
2. Filter Candidate Products
   │
   ├─> Same categories (Vitamins & Supplements, Health Essentials)
   ├─> Not already purchased
   └─> In stock (stock > 0)
   │
3. Calculate Similarity Scores
   │
   ├─> For each candidate:
   │   ├─> Compare with ALL purchased medicines
   │   ├─> Calculate similarity using weighted factors:
   │   │   ├─> Product Type (30%)
   │   │   ├─> Condition Type (20%)
   │   │   ├─> Major Type (10%)
   │   │   ├─> Name Similarity (20%)
   │   │   ├─> Description Similarity (10%)
   │   │   └─> Product Offerings (10%)
   │   └─> Take MAXIMUM similarity score
   │
4. Filter by Threshold
   │
   └─> Only include candidates with similarity ≥ 30%
   │
5. Rank and Return
   │
   ├─> Sort by similarity score (descending)
   └─> Return top 10 recommendations
```

### Implementation Details

#### 1. Purchase History Collection (`userPurchasedMedicinesProvider`)

**Purpose**: Extract user's relevant purchase history for recommendation analysis.

**Filtering Criteria**:
- Only **completed** or **delivered** orders
- Only **Vitamins & Supplements** and **Health Essentials** categories
- Remove duplicates

**Code Location**: `lib/features/pharmacy/presentation/providers/recommendation_provider.dart:10-65`

```dart
// Filter completed orders
final completedOrders = orders.where((order) {
  return order.status == OrderStatus.completed ||
         order.status == OrderStatus.delivered;
}).toList();

// Only include target categories
if (medicine.productType == MedicineProductType.vitaminsSupplements ||
    medicine.productType == MedicineProductType.healthEssentials) {
  purchasedMedicines.add(medicine);
}
```

#### 2. Candidate Filtering

**Purpose**: Create a pool of potential recommendations.

**Filtering Criteria**:
- Same product categories (Vitamins & Supplements, Health Essentials)
- Not in user's purchase history
- In stock (stock > 0)

**Code Location**: `lib/features/pharmacy/presentation/providers/recommendation_provider.dart:177-184`

```dart
final candidates = allMedicines.where((medicine) {
  return (medicine.productType == MedicineProductType.vitaminsSupplements ||
          medicine.productType == MedicineProductType.healthEssentials) &&
         !purchasedIds.contains(medicine.id) &&
         medicine.stock > 0;
}).toList();
```

#### 3. Similarity Calculation (`_calculateSimilarity`)

**Purpose**: Calculate how similar a candidate product is to user's purchase history.

**Similarity Factors** (Weighted):

| Factor | Weight | Description |
|--------|--------|-------------|
| Product Type | 30% | Same category (Vitamins, Health Essentials) |
| Condition Type | 20% | Same condition (Pain/Fever, Cough/Cold, etc.) |
| Major Type | 10% | Same major type (Generic, Branded) |
| Name Similarity | 20% | Text similarity in medicine names |
| Description Similarity | 10% | Text similarity in descriptions |
| Product Offerings | 10% | Similarity in product features/offerings |

**Formula**:
```
Similarity = (ProductType × 30 + ConditionType × 20 + MajorType × 10 + 
              NameSimilarity × 20 + DescSimilarity × 10 + 
              OfferingsSimilarity × 10) / 100
```

**Code Location**: `lib/features/pharmacy/presentation/providers/recommendation_provider.dart:79-126`

```dart
double score = 0.0;

// Product type match (30%)
if (purchased.productType == candidate.productType) {
  score += 30;
}

// Condition type match (20%)
if (purchased.conditionType == candidate.conditionType) {
  score += 20;
}

// ... (other factors)

return (score / maxScore) * 100; // Normalize to 0-100%
```

#### 4. String Similarity (`_calculateStringSimilarity`)

**Purpose**: Calculate text similarity between two strings using Jaccard similarity.

**Algorithm**: Jaccard Similarity Coefficient
```
Similarity = |Intersection| / |Union|
```

**Process**:
1. Split strings into words (length > 2)
2. Create word sets
3. Calculate intersection (common words)
4. Calculate union (all unique words)
5. Return intersection/union ratio

**Code Location**: `lib/features/pharmacy/presentation/providers/recommendation_provider.dart:128-143`

```dart
final words1 = str1.split(RegExp(r'\s+')).where((w) => w.length > 2).toSet();
final words2 = str2.split(RegExp(r'\s+')).where((w) => w.length > 2).toSet();

final intersection = words1.intersection(words2).length;
final union = words1.union(words2).length;

return union > 0 ? intersection / union : 0.0;
```

**Example**:
```
Medicine A: "Vitamin C 1000mg Tablets"
Medicine B: "Vitamin C 500mg Capsules"

Words A: {Vitamin, C, 1000mg, Tablets}
Words B: {Vitamin, C, 500mg, Capsules}

Intersection: {Vitamin, C} = 2
Union: {Vitamin, C, 1000mg, Tablets, 500mg, Capsules} = 6

Similarity = 2/6 = 0.33 (33%)
```

#### 5. List Similarity (`_calculateListSimilarity`)

**Purpose**: Calculate similarity between product offerings/features lists.

**Algorithm**: Same Jaccard similarity for sets

**Code Location**: `lib/features/pharmacy/presentation/providers/recommendation_provider.dart:145-157`

#### 6. Recommendation Generation (`recommendedMedicinesProvider`)

**Purpose**: Generate final recommendations by scoring and ranking candidates.

**Process**:
1. For each candidate:
   - Compare with ALL purchased medicines
   - Find MAXIMUM similarity score
   - Only include if similarity ≥ 30% threshold
2. Sort by similarity (descending)
3. Return top 10

**Code Location**: `lib/features/pharmacy/presentation/providers/recommendation_provider.dart:159-216`

```dart
for (final candidate in candidates) {
  double maxSimilarity = 0.0;
  
  // Find highest similarity across all purchases
  for (final purchased in purchasedMedicines) {
    final similarity = _calculateSimilarity(purchased, candidate);
    if (similarity > maxSimilarity) {
      maxSimilarity = similarity;
    }
  }
  
  // Only include if above threshold
  if (maxSimilarity >= 30.0) {
    scoredCandidates.add((medicine: candidate, score: maxSimilarity));
  }
}

// Sort and return top 10
scoredCandidates.sort((a, b) => b.score.compareTo(a.score));
return scoredCandidates.take(10).map((item) => item.medicine).toList();
```

### Why This Algorithm Works

1. **Collaborative Filtering**: Uses purchase history to understand user preferences
2. **Content-Based**: Analyzes product attributes (type, condition, description)
3. **Hybrid Approach**: Combines both methods for better accuracy
4. **Threshold Filtering**: Only recommends products with meaningful similarity (≥30%)
5. **Top-K Selection**: Returns most relevant recommendations (top 10)

### Time Complexity

- **Purchase History**: O(o × m) where o = orders, m = medicines per order
- **Candidate Filtering**: O(n) where n = total medicines
- **Similarity Calculation**: O(p × c × f) where:
  - p = purchased medicines
  - c = candidates
  - f = similarity factors (6 factors)
- **Sorting**: O(c log c)

**Overall**: O(o×m + n + p×c×f + c log c)

**Typical Case**: 
- p ≈ 10-50 purchased medicines
- c ≈ 100-500 candidates
- **Worst Case**: ~25,000 similarity calculations (manageable)

### Space Complexity

- **Purchase History**: O(p)
- **Candidates**: O(c)
- **Scored Candidates**: O(c)
- **Temporary Variables**: O(1)

**Overall**: O(p + c) - Linear space complexity

---

## Distance Calculation (Haversine Formula)

### Overview
We use the **Haversine Formula** to calculate the great-circle distance between two points on Earth's surface. This is essential for:
- Finding nearest pharmacies
- Calculating delivery distances
- Displaying distance information

### Formula

```
a = sin²(Δlat/2) + cos(lat1) × cos(lat2) × sin²(Δlon/2)
c = 2 × atan2(√a, √(1−a))
d = R × c
```

Where:
- `lat1, lon1` = Latitude and longitude of point 1
- `lat2, lon2` = Latitude and longitude of point 2
- `R` = Earth's radius (6,371 km)
- `d` = Distance in kilometers

### Implementation

**Code Location**: `lib/features/pharmacy/presentation/services/directions_service.dart:205-221`

```dart
static double calculateDistance(LatLng point1, LatLng point2) {
  const double earthRadius = 6371; // Earth radius in kilometers

  double dLat = _toRadians(point2.latitude - point1.latitude);
  double dLng = _toRadians(point2.longitude - point1.longitude);

  double a = sin²(dLat/2) + cos(lat1) × cos(lat2) × sin²(dLng/2);
  double c = 2 × atan2(√a, √(1-a));

  return earthRadius × c;
}
```

### Why Haversine Formula?

1. **Accuracy**: Accounts for Earth's curvature (not flat surface)
2. **Efficiency**: O(1) time complexity - constant time calculation
3. **Standard**: Industry-standard for geographic distance calculations
4. **Reliability**: Works for any two points on Earth

### Accuracy

- **Error Margin**: ±0.5% for typical distances
- **Best For**: Distances < 200 km (our use case)
- **Limitations**: Assumes perfect sphere (Earth is slightly ellipsoidal, but negligible for our needs)

---

## Summary

### Route Optimization
- **Algorithm Type**: Dijkstra-like route selection
- **Complexity**: O(n + m) time, O(p) space
- **Key Feature**: Multi-criteria optimization (time, traffic, distance)

### Product Recommendations
- **Algorithm Type**: Hybrid Collaborative + Content-Based Filtering
- **Complexity**: O(p × c × f) time, O(p + c) space
- **Key Feature**: Weighted similarity scoring with threshold filtering

### Distance Calculation
- **Algorithm Type**: Haversine Formula
- **Complexity**: O(1) time, O(1) space
- **Key Feature**: Accurate great-circle distance calculation

---

## References

- **Dijkstra's Algorithm**: Edsger W. Dijkstra (1956)
- **Haversine Formula**: Navigation and astronomy
- **Jaccard Similarity**: Paul Jaccard (1912)
- **Collaborative Filtering**: GroupLens Research (1992)

