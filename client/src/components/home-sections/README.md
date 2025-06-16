# Home Section Components

This directory contains individual components for each section of the Home page, allowing you to customize the design, content, and functionality of each section independently while maintaining the shared video background functionality.

## Components

### 1. HeroSection.jsx
- **Purpose**: Landing/welcome section
- **Current Design**: Simple centered layout with call-to-action
- **Customizable**: Title, description, button text, button styling

### 2. ShopSection.jsx
- **Purpose**: E-commerce/shop promotion
- **Current Design**: Premium badge, feature highlights, gradient button
- **Customizable**: Feature icons, badge text, color scheme, layout

### 3. GymBrosSection.jsx
- **Purpose**: Fitness tracking/progress monitoring
- **Current Design**: Stats grid, tracking badge, analytics icons
- **Customizable**: Stats layout, progress indicators, chart elements

### 4. GamesSection.jsx
- **Purpose**: Gamification/fitness games
- **Current Design**: Animated elements, gaming badges, reward highlights
- **Customizable**: Animation effects, game features, reward system display

### 5. CoachingSection.jsx
- **Purpose**: Personal training/coaching services
- **Current Design**: Benefits grid, coach certification badge, service highlights
- **Customizable**: Benefit layout, coach profiles, pricing display

## How to Customize

### Changing Content
Each component receives these props:
- `onNavigate`: Function to handle navigation
- `isActive`: Boolean indicating if this section is currently active

### Styling Guidelines
- Use `isActive` prop for entrance/exit animations
- Maintain backdrop blur and border styling for consistency
- Use section-specific color schemes (defined in each component)
- Keep the pointer-events structure for proper interaction

### Adding New Sections
1. Create a new component in this directory
2. Import and add it to `index.js`
3. Add the case in `SectionWrapper.jsx`
4. Add section data to the `sections` array in `Home.jsx`

### Example Customization

```jsx
// In GamesSection.jsx - Adding a leaderboard
<div className="bg-green-500/10 rounded-lg p-4 mb-4">
  <h3 className="text-green-200 font-bold mb-2">Leaderboard</h3>
  <div className="space-y-2">
    {/* Add leaderboard items */}
  </div>
</div>
```

## File Structure
```
home-sections/
├── index.js              # Exports all components
├── SectionWrapper.jsx    # Handles video background and component mapping
├── HeroSection.jsx       # Landing section
├── ShopSection.jsx       # E-commerce section  
├── GymBrosSection.jsx    # Fitness tracking section
├── GamesSection.jsx      # Gaming section
├── CoachingSection.jsx   # Coaching section
└── README.md            # This file
```

## Animation Classes
- `opacity-100 translate-y-0 scale-100`: Active state
- `opacity-0 translate-y-12 scale-95`: Inactive state
- `transition-all duration-800`: Smooth transitions

## Color Schemes
- **Hero**: Blue gradient
- **Shop**: Indigo gradient  
- **GymBros**: Purple gradient
- **Games**: Green gradient
- **Coaching**: Red gradient
