import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { Header } from './Header'
import { ThemeProvider } from '../../context/ThemeContext'

describe('SupportIQ Global Search (Ctrl+K)', () => {
  it('renders search input with placeholder and Ctrl + K badge', () => {
    render(
      <MemoryRouter>
        <ThemeProvider>
          <Header searchPlaceholder="Search Dashboard..." />
        </ThemeProvider>
      </MemoryRouter>,
    )

    const input = screen.getByPlaceholderText('Search Dashboard...')
    expect(input).toBeInTheDocument()
    expect(screen.getByText('Ctrl + K')).toBeInTheDocument()
  })

  it('focuses search input and calls preventDefault when Ctrl+K is pressed', () => {
    render(
      <MemoryRouter>
        <ThemeProvider>
          <Header searchPlaceholder="Search Dashboard..." />
        </ThemeProvider>
      </MemoryRouter>,
    )

    const input = screen.getByPlaceholderText('Search Dashboard...')
    expect(document.activeElement).not.toBe(input)

    const event = new KeyboardEvent('keydown', {
      key: 'k',
      ctrlKey: true,
      bubbles: true,
      cancelable: true,
    })
    const preventDefaultSpy = vi.spyOn(event, 'preventDefault')

    window.dispatchEvent(event)

    expect(preventDefaultSpy).toHaveBeenCalled()
    expect(document.activeElement).toBe(input)
  })

  it('focuses search input and calls preventDefault when Cmd+K (metaKey) is pressed on macOS', () => {
    render(
      <MemoryRouter>
        <ThemeProvider>
          <Header searchPlaceholder="Search Dashboard..." />
        </ThemeProvider>
      </MemoryRouter>,
    )

    const input = screen.getByPlaceholderText('Search Dashboard...')
    expect(document.activeElement).not.toBe(input)

    const event = new KeyboardEvent('keydown', {
      key: 'k',
      metaKey: true,
      bubbles: true,
      cancelable: true,
    })
    const preventDefaultSpy = vi.spyOn(event, 'preventDefault')

    window.dispatchEvent(event)

    expect(preventDefaultSpy).toHaveBeenCalled()
    expect(document.activeElement).toBe(input)
  })

  it('allows user to type search term after activating search with Ctrl+K', () => {
    render(
      <MemoryRouter>
        <ThemeProvider>
          <Header searchPlaceholder="Search Dashboard..." />
        </ThemeProvider>
      </MemoryRouter>,
    )

    const input = screen.getByPlaceholderText('Search Dashboard...') as HTMLInputElement

    window.dispatchEvent(
      new KeyboardEvent('keydown', {
        key: 'k',
        ctrlKey: true,
        bubbles: true,
        cancelable: true,
      }),
    )

    expect(document.activeElement).toBe(input)

    fireEvent.change(input, { target: { value: 'refund' } })
    expect(input.value).toBe('refund')
  })

  it('blurs search input when Escape key is pressed', () => {
    render(
      <MemoryRouter>
        <ThemeProvider>
          <Header searchPlaceholder="Search Dashboard..." />
        </ThemeProvider>
      </MemoryRouter>,
    )

    const input = screen.getByPlaceholderText('Search Dashboard...')

    // Focus input
    input.focus()
    expect(document.activeElement).toBe(input)

    // Press Escape
    window.dispatchEvent(
      new KeyboardEvent('keydown', {
        key: 'Escape',
        bubbles: true,
        cancelable: true,
      }),
    )

    expect(document.activeElement).not.toBe(input)
  })

  it('focuses search input when clicking on the Ctrl + K badge', () => {
    render(
      <MemoryRouter>
        <ThemeProvider>
          <Header searchPlaceholder="Search Dashboard..." />
        </ThemeProvider>
      </MemoryRouter>,
    )

    const input = screen.getByPlaceholderText('Search Dashboard...')
    const badge = screen.getByText('Ctrl + K')

    expect(document.activeElement).not.toBe(input)
    fireEvent.click(badge)
    expect(document.activeElement).toBe(input)
  })
})
