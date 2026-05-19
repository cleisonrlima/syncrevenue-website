import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import FormSelect from './FormSelect'

describe('FormSelect', () => {
  it('renders native select wrapped in .select-wrap with aria-hidden chevron', () => {
    const { container } = render(
      <FormSelect id="demo-role" aria-label="Role">
        <option value="">Select</option>
        <option value="owner">Owner</option>
      </FormSelect>,
    )
    const select = screen.getByRole('combobox', { name: 'Role' })
    expect(select).toBeInTheDocument()
    const wrap = container.querySelector('.select-wrap')
    expect(wrap).toContainElement(select)
    const chevron = container.querySelector('[aria-hidden="true"]')
    expect(chevron).not.toBeNull()
  })

  it('sets aria-invalid when invalid prop is true', () => {
    render(
      <FormSelect id="demo-gds" aria-label="GDS" invalid>
        <option value="">Select</option>
      </FormSelect>,
    )
    expect(screen.getByRole('combobox', { name: 'GDS' })).toHaveAttribute('aria-invalid', 'true')
  })

  it('passes children options through and forces option background', () => {
    render(
      <FormSelect id="x" aria-label="X">
        <option value="">Select</option>
        <option value="a" style={{ color: 'white', background: 'red' }}>
          Alpha
        </option>
        <option value="b">Beta</option>
      </FormSelect>,
    )
    const alpha = screen.getByRole('option', { name: 'Alpha' })
    expect(alpha).toBeInTheDocument()
    expect(alpha).toHaveStyle({ color: 'rgb(255, 255, 255)', background: '#0A0B2E' })
    expect(screen.getByRole('option', { name: 'Beta' })).toBeInTheDocument()
  })
})
