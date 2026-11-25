import { Button, Menu, MenuItem, MenuList, MenuPopover, MenuTrigger } from '@fluentui/react-components';
import { DataBarVerticalRegular } from '@fluentui/react-icons';
import { getPreviewState, setPreviewState, type PreviewDataState } from '../api/previewState';

const states: PreviewDataState[] = ['data', 'loading', 'empty', 'error'];

export function PreviewStateSwitcher() {
  if (!import.meta.env.DEV) return null;
  return (
    <Menu>
      <MenuTrigger disableButtonEnhancement>
        <Button className="preview-switcher" appearance="primary" size="small" icon={<DataBarVerticalRegular />}>
          Preview: {getPreviewState()}
        </Button>
      </MenuTrigger>
      <MenuPopover>
        <MenuList>
          {states.map((state) => (
            <MenuItem key={state} onClick={() => setPreviewState(state)}>Show {state} state</MenuItem>
          ))}
        </MenuList>
      </MenuPopover>
    </Menu>
  );
}
