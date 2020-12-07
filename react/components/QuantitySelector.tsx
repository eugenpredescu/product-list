import type { FC } from 'react'
import React, { useState, Fragment, useEffect, useContext } from 'react'
import type { IntlShape } from 'react-intl'
import { defineMessages, useIntl } from 'react-intl'
import { Dropdown, Input, ToastContext } from 'vtex.styleguide'
import { useCssHandles } from 'vtex.css-handles'

import { parseValue, parseDisplayValue, normalizeValue } from './utils'
import useQuantitySelectorState from './useQuantitySelectorState'

const range = (startValue: number, endNumber: number) => {
  const array = []

  for (let i = startValue; i < endNumber; i++) {
    array.push(i)
  }

  return array
}

const messages = defineMessages({
  remove: {
    defaultMessage: '',
    id: 'store/product-list.quantity-selector.remove',
  },
  label: { id: 'store/product-list.quantitySelector.label' },
  maxValueLabel: { id: 'store/product-list.quantitySelector.maxValueLabel' },
})

const MAX_DROPDOWN_VALUE = 10
const MAX_INPUT_LENGTH = 5

/* eslint-disable @typescript-eslint/no-shadow */
const enum SelectorType {
  Dropdown = 'Dropdown',
  Input = 'Input',
}
/* eslint-enable @typescript-eslint/no-shadow */

interface Props {
  id?: string
  value: number
  maxValue: number
  onChange: (value: number) => void
  disabled?: boolean
  unitMultiplier?: number
  measurementUnit?: string
}

const getDropdownOptions = ({
  maxValue,
  intl,
  unitMultiplier,
  measurementUnit,
}: {
  maxValue: number
  intl: IntlShape
  unitMultiplier: number
  measurementUnit?: string
}) => {
  const limit = Math.min(9, maxValue)
  const options = [
    { value: 0, label: `0 - ${intl.formatMessage(messages.remove)}` },
    ...range(1, limit + 1).map((idx) => ({
      value: idx,
      label: intl.formatMessage(messages.label, {
        quantity: intl.formatNumber(idx * unitMultiplier),
        measurementUnit,
      }),
    })),
  ]

  if (maxValue >= MAX_DROPDOWN_VALUE) {
    options.push({
      value: MAX_DROPDOWN_VALUE,
      label: intl.formatMessage(messages.maxValueLabel, {
        quantity: intl.formatNumber(MAX_DROPDOWN_VALUE * unitMultiplier),
        measurementUnit,
      }),
    })
  }

  return options
}

const CSS_HANDLES = [
  'quantityDropdownMobileContainer',
  'quantityDropdownContainer',
  'quantityInputMobileContainer',
  'quantityInputContainer',
] as const

const QuantitySelector: FC<Props> = ({
  id,
  value,
  maxValue,
  onChange,
  disabled = false,
  unitMultiplier = 1,
  measurementUnit: itemMeasurementUnit,
}) => {
  const measurementUnit =
    itemMeasurementUnit && itemMeasurementUnit !== 'un'
      ? itemMeasurementUnit
      : undefined

  const intl = useIntl()

  const [curSelector, setSelector] = useState(
    value < MAX_DROPDOWN_VALUE ? SelectorType.Dropdown : SelectorType.Input
  )

  const [inputFocused, setInputFocused] = useState(false)
  const [getUpdatedValue] = useQuantitySelectorState({
    maxValue,
    measurementUnit,
    minValue: 1,
  })

  const normalizedValue = normalizeValue(value, maxValue)

  const [curDisplayValue, setDisplayValue] = useState(
    intl.formatNumber(
      parseDisplayValue({
        value: normalizedValue.toString(),
        maxValue,
        unitMultiplier,
      }),
      { useGrouping: false }
    )
  )

  const handles = useCssHandles(CSS_HANDLES)

  const handleDropdownChange = (inputValue: string) => {
    const { validatedValue, validatedDisplayValue } = getUpdatedValue({
      value: inputValue,
      unitMultiplier: 1,
      displayUnitMultiplier: unitMultiplier,
    })

    if (validatedValue >= MAX_DROPDOWN_VALUE) {
      setSelector(SelectorType.Input)
    }

    setDisplayValue(validatedDisplayValue)
    onChange(validatedValue)
  }

  const handleInputChange = (inputValue: string) => {
    setDisplayValue(inputValue)
  }

  const handleInputBlur = () => {
    setInputFocused(false)

    if (curDisplayValue === '') {
      setDisplayValue(
        intl.formatNumber(
          parseDisplayValue({ value: '1', maxValue, unitMultiplier }),
          {
            useGrouping: false,
          }
        )
      )
    }

    const { validatedValue, validatedDisplayValue } = getUpdatedValue({
      value: curDisplayValue,
      unitMultiplier,
    })

    onChange(validatedValue)

    if (validatedValue < MAX_DROPDOWN_VALUE) {
      setSelector(SelectorType.Dropdown)
    }

    setDisplayValue(validatedDisplayValue)
  }

  const handleInputFocus = () => {
    setInputFocused(true)
  }

  useEffect(() => {
    if (inputFocused) {
      return
    }

    if (normalizedValue >= MAX_DROPDOWN_VALUE) {
      setSelector(SelectorType.Input)
    }

    setDisplayValue(
      intl.formatNumber(
        parseDisplayValue({
          value: normalizedValue.toString(),
          maxValue,
          unitMultiplier,
        }),
        { useGrouping: false }
      )
    )
  }, [
    inputFocused,
    maxValue,
    measurementUnit,
    unitMultiplier,
    normalizedValue,
    intl,
  ])

  if (curSelector === SelectorType.Dropdown) {
    const dropdownOptions = getDropdownOptions({
      maxValue,
      intl,
      unitMultiplier,
      measurementUnit,
    })

    return (
      <Fragment>
        <div className={`${handles.quantityDropdownMobileContainer} dn-m`}>
          <Dropdown
            id={`quantity-dropdown-mobile-${id}`}
            testId={`quantity-dropdown-mobile-${id}`}
            options={dropdownOptions}
            size="small"
            value={normalizedValue}
            onChange={(event: any) => handleDropdownChange(event.target.value)}
            placeholder=" "
            disabled={disabled}
          />
        </div>
        <div className={`${handles.quantityDropdownContainer} dn db-m`}>
          <Dropdown
            id={`quantity-dropdown-${id}`}
            testId={`quantity-dropdown-${id}`}
            options={dropdownOptions}
            value={normalizedValue}
            onChange={(event: any) => handleDropdownChange(event.target.value)}
            placeholder=" "
            disabled={disabled}
          />
        </div>
      </Fragment>
    )
  }

  return (
    <Fragment>
      <div className={`${handles.quantityInputMobileContainer} dn-m`}>
        <Input
          id={`quantity-input-mobile-${id}`}
          size="small"
          value={curDisplayValue}
          maxLength={MAX_INPUT_LENGTH}
          onChange={(event: any) => handleInputChange(event.target.value)}
          onBlur={handleInputBlur}
          onFocus={handleInputFocus}
          placeholder=""
          disabled={disabled}
          suffix={measurementUnit}
        />
      </div>
      <div className={`${handles.quantityInputContainer} dn db-m`}>
        <Input
          id={`quantity-input-${id}`}
          value={curDisplayValue}
          maxLength={MAX_INPUT_LENGTH}
          onChange={(event: any) => handleInputChange(event.target.value)}
          onBlur={handleInputBlur}
          onFocus={handleInputFocus}
          placeholder=""
          disabled={disabled}
          suffix={measurementUnit}
        />
      </div>
    </Fragment>
  )
}

export default QuantitySelector
