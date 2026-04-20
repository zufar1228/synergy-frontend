/**
 * @file intrusi/index.ts
 * @purpose Barrel export for intrusi (door security) feature components
 * @usedBy SystemPage
 * @deps IntrusiView, IntrusiDataTable, IntrusiDeviceControls, IntrusiEventChart, IntrusiStatusBadges, IntrusiReviewForm
 * @exports IntrusiView, IntrusiDataTable, IntrusiDeviceControls, IntrusiEventChart, StatusBadge, EventTypeBadge, ExpandableReviewForm
 * @sideEffects None
 */

// Feature: Intrusi (Intrusion Detection — Door Security)
export { IntrusiView } from './components/IntrusiView';
export { IntrusiDataTable } from './components/IntrusiDataTable';
export { IntrusiDeviceControls } from './components/IntrusiDeviceControls';
export { IntrusiEventChart } from './components/IntrusiEventChart';
export { StatusBadge, EventTypeBadge, getSeverityColor } from './components/IntrusiStatusBadges';
export { ExpandableReviewForm } from './components/IntrusiReviewForm';
