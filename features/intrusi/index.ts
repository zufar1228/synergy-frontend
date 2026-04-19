/**
 * @file intrusi/index.ts
 * @purpose Barrel export for intrusi (door security) feature components
 * @usedBy SystemPage
 * @deps IntrusiView, IntrusiDataTable, IntrusiDeviceControls, IntrusiEventChart
 * @exports IntrusiView, IntrusiDataTable, IntrusiDeviceControls, IntrusiEventChart
 * @sideEffects None
 */

// Feature: Intrusi (Intrusion Detection — Door Security)
export { IntrusiView } from './components/IntrusiView';
export { IntrusiDataTable } from './components/IntrusiDataTable';
export { IntrusiDeviceControls } from './components/IntrusiDeviceControls';
export { IntrusiEventChart } from './components/IntrusiEventChart';
