import { StackActions } from '@react-navigation/native';

import type { DockTabKey } from './dockTabs';

type Dispatcher = {
  dispatch: (action: ReturnType<typeof StackActions.popTo>) => void;
};

/**
 * Kembali ke `DockTabs` pada tab tertentu, menutup layar yang ditumpuk di
 * atasnya. Sama dengan mengetuk tab di dock.
 */
export function openDockTab(navigation: Dispatcher, tab: DockTabKey): void {
  navigation.dispatch(StackActions.popTo('DockTabs', { tab }, { merge: true }));
}
