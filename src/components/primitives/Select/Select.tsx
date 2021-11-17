import React, { forwardRef, memo } from 'react';
import type { ISelectProps } from './types';
import { Platform, View, Pressable, Keyboard } from 'react-native';
import { Actionsheet } from '../../composites/Actionsheet';
import Box from '../Box';
import { Input } from '../Input';
import { useFocusRing } from '@react-native-aria/focus';
import { useControllableState } from '../../../hooks';
import { usePropsResolution } from '../../../hooks/useThemeProps';
import { useHover } from '@react-native-aria/interactions';
import { mergeRefs } from '../../../utils';
import { useFormControl } from '../../composites/FormControl';
import { extractInObject, stylingProps } from '../../../theme/tools/utils';
import { ChevronDownIcon } from '../Icon/Icons';
import type { IButtonProps } from '../Button/types';
import { ScrollView } from '../../basic/ScrollView';
import { useHasResponsiveProps } from '../../../hooks/useHasResponsiveProps';

const unstyledSelecWebtStyles = {
  width: '100%',
  height: '100%',
  appearance: 'none',
  WebkitAppearance: 'none',
  MozAppearance: 'none',
};

export const SelectContext = React.createContext({
  onValueChange: (() => {}) as any,
  selectedValue: null as any,
  _selectedItem: {} as IButtonProps,
  _item: {} as IButtonProps,
});

const Select = ({ wrapperRef, ...props }: ISelectProps, ref: any) => {
  const selectProps = useFormControl({
    isDisabled: props.isDisabled,
    nativeID: props.nativeID,
  });

  const isDisabled = selectProps.disabled;
  const tempFix = '__NativebasePlaceholder__';
  const _ref = React.useRef(null);

  const [isFocused, setIsFocused] = React.useState(false);
  const [isOpen, setIsOpen] = React.useState<boolean>(false);

  const { focusProps, isFocusVisible } = useFocusRing();
  const { hoverProps, isHovered } = useHover({ isDisabled }, _ref);

  const {
    onValueChange,
    selectedValue,
    children,
    dropdownIcon,
    dropdownCloseIcon,
    dropdownOpenIcon,
    placeholder,
    accessibilityLabel,
    defaultValue,
    _item,
    _selectedItem,
    size,
    onOpen,
    onClose,
    ...resolvedInputProps
  } = usePropsResolution('Input', props, {
    isDisabled,
    isHovered,
    isFocusVisible,
    isFocused,
    // TODO: can also add this for native select styling
    // isFocused: isFocused || isOpen,
  });

  const [value, setValue] = useControllableState({
    value: selectedValue,
    defaultValue,
    onChange: (newValue) => {
      onValueChange && onValueChange(newValue);
      setIsOpen(false);
    },
  });

  const itemsList: Array<{ label: string; value: string }> = React.Children.map(
    children,
    (child: any) => {
      return {
        label: child.props.label,
        value: child.props.value,
      };
    }
  );

  const selectedItemArray = itemsList.filter(
    (item: any) => item.value === value
  );
  const selectedItem =
    selectedItemArray && selectedItemArray.length ? selectedItemArray[0] : null;

  const {
    variant,
    customDropdownIconProps,
    _actionSheetContent,
    ...reslovedSelectProps
  } = usePropsResolution('Select', props, {
    isDisabled,
    isHovered,
    isFocusVisible,
    isFocused,
  });
  const [borderProps, remainingProps] = extractInObject(reslovedSelectProps, [
    ...stylingProps.border,
  ]);
  const [layoutProps, nonLayoutProps] = extractInObject(remainingProps, [
    ...stylingProps.margin,
    ...stylingProps.layout,
    ...stylingProps.flexbox,
    ...stylingProps.position,
    ...stylingProps.background,
    'children',
  ]);

  //TODO: refactor for responsive prop
  if (useHasResponsiveProps(props)) {
    return null;
  }

  const rightIcon =
    isOpen && dropdownOpenIcon ? (
      dropdownOpenIcon
    ) : !isOpen && dropdownCloseIcon ? (
      dropdownCloseIcon
    ) : dropdownIcon ? (
      dropdownIcon
    ) : (
      <ChevronDownIcon {...customDropdownIconProps} />
    );

  const commonInput = (
    <Input
      aria-hidden={true}
      importantForAccessibility="no"
      value={selectedItem?.label}
      placeholder={placeholder}
      editable={false}
      focusable={false}
      size={size}
      variant={variant}
      InputRightElement={rightIcon}
      height={layoutProps.height ?? layoutProps.h}
      {...resolvedInputProps}
      {...nonLayoutProps}
      {...borderProps}
      isDisabled={isDisabled}
    />
  );

  const handleClose = () => {
    setIsOpen(false);
    onClose && onClose();
  };

  return (
    <Box
      borderWidth={1}
      borderColor="transparent"
      borderRadius={resolvedInputProps.borderRadius}
      {...layoutProps}
      ref={wrapperRef}
    >
      {Platform.OS === 'web' ? (
        <>
          <Box w="100%" h="100%" position="absolute" opacity="0" zIndex={1}>
            <select
              aria-readonly={selectProps.readOnly}
              required={selectProps.required}
              disabled={isDisabled}
              {...focusProps}
              {...hoverProps}
              ref={mergeRefs([ref, _ref])}
              //@ts-ignore
              style={unstyledSelecWebtStyles}
              onChange={(e) => {
                setValue(e.target.value);
              }}
              value={selectedItem === null ? tempFix : value}
              aria-label={placeholder}
              onFocus={() => {
                setIsFocused(true);
                onOpen && onOpen();
              }}
              onBlur={() => {
                setIsFocused(false);
                onClose && onClose();
              }}
            >
              <option disabled value={tempFix}>
                {placeholder}
              </option>
              {children}
            </select>
          </Box>
          {commonInput}
        </>
      ) : (
        <>
          <Pressable
            onPress={() => {
              Keyboard.dismiss();
              setIsOpen(true);
              onOpen && onOpen();
            }}
            disabled={isDisabled}
            accessibilityLabel={accessibilityLabel}
            accessibilityRole="button"
            ref={mergeRefs([ref, _ref])}
          >
            <View pointerEvents="none">{commonInput}</View>
          </Pressable>
          <Actionsheet isOpen={isOpen} onClose={handleClose}>
            <Actionsheet.Content {..._actionSheetContent}>
              <ScrollView width="100%">
                <SelectContext.Provider
                  value={{
                    onValueChange: setValue,
                    selectedValue: value,
                    _selectedItem: _selectedItem ?? {},
                    _item: _item ?? {},
                  }}
                >
                  {children}
                </SelectContext.Provider>
              </ScrollView>
            </Actionsheet.Content>
          </Actionsheet>
        </>
      )}
    </Box>
  );
};

export default memo(forwardRef(Select));
