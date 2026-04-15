---
title: "Sola Coffea: A Native iOS App for Coffee Obsessives"
date: "2026-04-14"
categories:
  - "ios"
  - "coffee"
  - "app-store"
tags:
  - "ios"
  - "swift"
  - "swiftui"
  - "coredata"
  - "cloudkit"
  - "coffee"
  - "app-store"
  - "storekit"
cover:
    image: "/posts/sola-coffea/sola-coffea-icon.png"
    alt: "Sola Coffea App Icon"
    caption: "<text>"
    relative: true
aliases:
    - /posts/sola-coffea/sola-coffea
    - /2026/sola-coffea
---

# Introducing Sola Coffea

After approximately three years of development, I am pleased to announce that **Sola Coffea** is now available on the App Store. It is a native iOS application constructed for individuals who approach their coffee with deliberation, whether you are cataloguing single-origin beans, calibrating espresso extractions, or discovering new establishments while traveling.

This project has been one of the most ambitious I have undertaken. What originated as a simple coffee logging concept evolved into a comprehensive platform encompassing brew analytics, social features, shop discovery, and a dedicated business tier for roasters and cafe proprietors.

- [**Sola Coffea on the App Store**](https://apps.apple.com/us/app/sola-coffea/id6737065958)

---

## Why I Built It

I required a single application that could supplant the dispersed notes, spreadsheets, and half-forgotten mental records I was maintaining about coffees I had encountered. Every existing option felt either too rudimentary or excessively cluttered. I wanted something that presented well, synchronized across devices, and could mature alongside my coffee knowledge.

Sola Coffea was constructed entirely from scratch as a native SwiftUI application with CoreData and CloudKit. No web views, no cross-platform frameworks. Every screen, animation, and interaction was designed specifically for iOS.

---

## Features

### Coffee Library

![Sola Coffea Home](/posts/sola-coffea/images/home.png)

Catalogue every coffee you encounter. Record the roaster, origin, producer, variety, process method, altitude, tasting notes, and additional attributes. Rate coffees, attach photographs, and cultivate a personal library that expands over time.

### Coffee Detail & Brew Logging

![Coffee Detail](/posts/sola-coffea/images/coffee-detail.png)

Each coffee maintains a detailed profile containing its complete metadata and brew history. Log brews with method-specific parameters including grind size, water temperature, brew duration, dose, and yield. For espresso, record TDS percentage, extraction yield, and pressure for precise calibration.

### Insights & Analytics

![Insights](/posts/sola-coffea/images/insights.png)

Sola Coffea transforms your accumulated data into actionable insights. Identify your flavor preferences, monitor rating trajectories, observe which origins and roasters you gravitate toward, and reveal patterns in your brewing methodology. The insights engine adapts as your library expands, progressively surfacing more granular analytics.

### Origin Map

![Origin Map](/posts/sola-coffea/images/origin-map.png)

Visualize every coffee origin you have explored on an interactive world map. Observe your map populate as you sample coffees from new regions, a gratifying representation of how extensively your palate has traveled.

### Coffee DNA

![Coffee DNA](/posts/sola-coffea/images/coffee-dna.png)

Your Coffee DNA is a personalized profile of your taste preferences, derived from your ratings and tasting notes. It illustrates your affinity for different flavor categories, processing methods, and roast levels at a glance.

### Shop Discovery

![Shops](/posts/sola-coffea/images/shops.png)

Locate and preserve coffee shops in your vicinity. Document visits, annotate observations, and import saved locations from Google Maps. Verified shop proprietors can claim their establishment, publish daily menus via the Bean Board, distribute brew guides, and list their coffees for patrons to discover.

### Social Feed & Profile

![Profile](/posts/sola-coffea/images/profile.png)

Share your coffee discoveries with the community. Publish reviews, follow other coffee enthusiasts, participate in Coffee Circles for collective discussions, and discover trending coffees. Your profile presents your statistics, achievements, principal origins, and brewing activity.

---

## Brew Guides & Timers

Sola Coffea incorporates 23 step-by-step brew guides encompassing every major preparation method: pour-over, French press, AeroPress, espresso, cold brew, and more. Each guide features an integrated timer with haptic feedback that conducts you through every phase, from bloom to final draw-down. Roasters can additionally publish their own recommended brew guides for their coffees.

---

## For Shops & Roasters

Sola Coffea includes a comprehensive business tier for coffee shop proprietors and roasters:

- **Claim your establishment** and receive a verified badge
- **Bean Board** for publishing daily menus and featured coffees
- **Brew guides** that patrons can follow at home
- **Coffee listings** enabling customers to browse and incorporate your beans into their library
- **Analytics dashboard** with real-time engagement metrics

---

## The Technical Stack

For those interested in the engineering composition:

- **SwiftUI** for the complete UI layer
- **CoreData** with `NSPersistentCloudKitContainer` for local persistence and cross-device synchronization
- **CloudKit** public database for social features, shop data, and community content
- **StoreKit 2** for subscriptions (monthly, annual, lifetime, and business tiers)
- **MapKit** for shop discovery and origin visualization
- **CoreImage** for QR code generation and branded share cards

The application supports iPhone and iPad, synchronizing seamlessly across devices through iCloud.

---

## Availability

Sola Coffea is available as a complimentary download with core tracking features accessible to all users. A Pro subscription enables advanced insights, the brew lab, data export, shop intelligence, and additional capabilities.

- [**Download Sola Coffea on the App Store**](https://apps.apple.com/us/app/sola-coffea/id6737065958)
- [**Website**](https://solacoffea.app)

---

Three years of early mornings, late evenings, and a considerable quantity of coffee contributed to this application. It has been one of the most rewarding projects I have worked on, and I am genuinely proud of the result. I hope it becomes a valuable companion for your own coffee journey.

> As always, if you have any questions, feel free to reach out at [support@solacoffea.app](mailto:support@solacoffea.app) or contact me directly at [robert@whitematter.tech](mailto:robert@whitematter.tech).
>
> Thanks for reading!
>
> Robert
