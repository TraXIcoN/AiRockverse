import React from "react";

export const DrummerStickFigure = () => (
  <svg viewBox="0 0 200 200" className="w-32 h-32 mx-auto mb-4">
    <g
      stroke="currentColor"
      fill="none"
      strokeWidth="4"
      className="text-primary-light"
    >
      {/* Drummer */}
      <g transform="translate(-30, 0)">
        <circle cx="100" cy="50" r="20" /> {/* Head */}
        <path d="M80 40 H120 M90 40 V30 H110 V40" /> {/* Hat */}
        <line x1="100" y1="70" x2="100" y2="120" /> {/* Body */}
        <path d="M100 90 L70 110 L80 120" className="animate-bounce" />{" "}
        {/* Drumming arms */}
        <path
          d="M100 90 L130 110 L120 120"
          className="animate-bounce delay-100"
        />
        <line x1="100" y1="120" x2="80" y2="160" /> {/* Legs */}
        <line x1="100" y1="120" x2="120" y2="160" />
        <rect x="60" y="120" width="80" height="20" rx="5" /> {/* Drum */}
      </g>

      {/* Guitarist */}
      <g transform="translate(30, 0)">
        <circle cx="100" cy="50" r="20" /> {/* Head */}
        <line x1="100" y1="70" x2="100" y2="120" /> {/* Body */}
        <path
          d="M100 90 L70 100 L65 120"
          className="animate-bounce delay-200"
        />{" "}
        {/* Guitar arms */}
        <path
          d="M100 90 L130 100 L135 120"
          className="animate-bounce delay-300"
        />
        <line x1="100" y1="120" x2="80" y2="160" /> {/* Legs */}
        <line x1="100" y1="120" x2="120" y2="160" />
        <path d="M65 120 L135 120 L145 140 L55 140 Z" /> {/* Guitar */}
      </g>
    </g>
  </svg>
);

export const AIAnalystStickFigure = () => (
  <svg viewBox="0 0 200 200" className="w-32 h-32 mx-auto mb-4">
    <g
      stroke="currentColor"
      fill="none"
      strokeWidth="4"
      className="text-primary-light"
    >
      {/* Head */}
      <circle cx="100" cy="50" r="20" />
      {/* Glasses */}
      <path d="M85 50 H115 M90 45 Q95 45 95 50 Q95 55 90 55 Q85 55 85 50 Z" />
      <path d="M105 45 Q110 45 110 50 Q110 55 105 55 Q100 55 100 50 Z" />
      {/* Body */}
      <line x1="100" y1="70" x2="100" y2="120" />
      {/* Arms with magnifying glass */}
      <path d="M100 90 L140 110" />
      <circle cx="150" cy="120" r="15" />
      <line x1="160" y1="130" x2="170" y2="140" />
      {/* Other arm */}
      <path d="M100 90 L60 110" />
      {/* Legs */}
      <line x1="100" y1="120" x2="80" y2="160" />
      <line x1="100" y1="120" x2="120" y2="160" />
      {/* Fallen Book */}
      <path d="M30 150 L60 150 L60 160 L30 160 Z" /> {/* Book cover */}
      <path
        d="M30 150 C40 145 50 145 60 150"
        className="animate-bounce delay-200"
      />{" "}
      {/* Pages fluttering */}
      {/* Music notes */}
      <path d="M40 60 Q45 55 50 60 L45 80" className="animate-bounce" />
      <path
        d="M170 70 Q175 65 180 70 L175 90"
        className="animate-bounce delay-100"
      />
    </g>
  </svg>
);

export const FeedbackStickFigure = () => (
  <svg viewBox="0 0 200 200" className="w-32 h-32 mx-auto mb-4">
    <g
      stroke="currentColor"
      fill="none"
      strokeWidth="4"
      className="text-primary-light"
    >
      {/* Stick Figure */}
      <circle cx="80" cy="50" r="20" /> {/* Head */}
      <line x1="80" y1="70" x2="80" y2="120" /> {/* Body */}
      <line x1="80" y1="90" x2="60" y2="110" /> {/* Arms */}
      <line x1="80" y1="90" x2="100" y2="110" />
      <line x1="80" y1="120" x2="60" y2="160" /> {/* Legs */}
      <line x1="80" y1="120" x2="100" y2="160" />
      {/* Stick Dog - Simplified */}
      <g transform="translate(30, 20)">
        {/* Dog head */}
        <circle cx="120" cy="80" r="15" />
        {/* Dog ear */}
        <path d="M110 70 L105 60" className="animate-bounce delay-200" />
        {/* Dog body */}
        <line x1="120" y1="95" x2="120" y2="130" />
        {/* Dog legs */}
        <line x1="120" y1="130" x2="110" y2="150" />
        <line x1="120" y1="130" x2="130" y2="150" />
        {/* Dog front legs */}
        <line x1="120" y1="110" x2="110" y2="130" />
        <line x1="120" y1="110" x2="130" y2="130" />
        {/* Wagging tail */}
        <path
          d="M120 105 L140 95"
          className="animate-wag origin-[120px_105px]"
        />
      </g>
    </g>
  </svg>
);

export const LevelUpStickFigure = () => (
  <svg viewBox="0 0 200 200" className="w-32 h-32 mx-auto mb-4 overflow-hidden">
    <g
      stroke="currentColor"
      fill="none"
      strokeWidth="4"
      className="text-primary-light"
    >
      {/* Moving Group */}
      <g className="animate-slide-lr">
        {/* Go Kart - Side View */}
        <g transform="translate(0, 20)">
          {/* Kart Body */}
          <path d="M70 120 L130 120" /> {/* Base */}
          <path d="M80 120 L90 100 L120 100 L130 120" /> {/* Side panel */}
          <path d="M85 100 L85 90 L125 90 L125 100" /> {/* Seat back */}
          {/* Wheels - Different sizes */}
          <circle cx="80" cy="120" r="15" className="animate-spin" />{" "}
          {/* Front wheel */}
          <circle cx="120" cy="120" r="20" className="animate-spin" />{" "}
          {/* Rear wheel */}
          {/* Stick Figure in Kart */}
          <circle cx="105" cy="75" r="12" /> {/* Head */}
          <line x1="105" y1="87" x2="105" y2="105" /> {/* Body */}
          <path d="M105 95 L90 105" /> {/* Left arm on wheel */}
          <path d="M105 95 L120 105" /> {/* Right arm on wheel */}
          {/* Level Up Effects */}
          <path d="M130 60 L140 45 L150 60" className="animate-bounce" />
          <path
            d="M145 50 L155 35 L165 50"
            className="animate-bounce delay-100"
          />
        </g>
      </g>
    </g>
  </svg>
);
