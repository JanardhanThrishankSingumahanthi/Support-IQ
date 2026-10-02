import '@testing-library/jest-dom/vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Register } from './Register'
import { Login } from './Login'

describe('SupportIQ User Registration Workflow', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    localStorage.clear()
  })

  it('renders all required registration fields on the signup page', () => {
    render(
      <MemoryRouter initialEntries={['/register']}>
        <Register />
      </MemoryRouter>,
    )

    expect(screen.getByRole('heading', { name: /create account/i })).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/alicia gomez/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/you@example\.com/i)).toBeInTheDocument()
    expect(screen.getByRole('combobox')).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/at least 8 characters/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/confirm your password/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
  })

  it('navigates from Login page to /register when clicking Sign up', async () => {
    render(
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Routes>
      </MemoryRouter>,
    )

    const signUpButton = screen.getByRole('button', { name: /sign up/i })
    fireEvent.click(signUpButton)

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /create account/i })).toBeInTheDocument()
    })
  })

  it('navigates from Register page to /login when clicking Sign in', async () => {
    render(
      <MemoryRouter initialEntries={['/register']}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Routes>
      </MemoryRouter>,
    )

    const signInButton = screen.getByRole('button', { name: /sign in/i })
    fireEvent.click(signInButton)

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /welcome back/i })).toBeInTheDocument()
    })
  })

  it('shows error and blocks submission if password confirmation does not match', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)

    render(
      <MemoryRouter initialEntries={['/register']}>
        <Register />
      </MemoryRouter>,
    )

    fireEvent.change(screen.getByPlaceholderText(/alicia gomez/i), { target: { value: 'Alice Smith' } })
    fireEvent.change(screen.getByPlaceholderText(/you@example\.com/i), { target: { value: 'alice@example.com' } })
    fireEvent.change(screen.getByPlaceholderText(/at least 8 characters/i), { target: { value: 'Password123!' } })
    fireEvent.change(screen.getByPlaceholderText(/confirm your password/i), { target: { value: 'DifferentPassword456!' } })

    fireEvent.click(screen.getByRole('button', { name: /create account/i }))

    expect(await screen.findByText(/passwords do not match/i)).toBeInTheDocument()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('shows error and blocks submission if password is less than 8 characters', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)

    render(
      <MemoryRouter initialEntries={['/register']}>
        <Register />
      </MemoryRouter>,
    )

    fireEvent.change(screen.getByPlaceholderText(/alicia gomez/i), { target: { value: 'Alice Smith' } })
    fireEvent.change(screen.getByPlaceholderText(/you@example\.com/i), { target: { value: 'alice@example.com' } })
    fireEvent.change(screen.getByPlaceholderText(/at least 8 characters/i), { target: { value: 'short' } })
    fireEvent.change(screen.getByPlaceholderText(/confirm your password/i), { target: { value: 'short' } })

    fireEvent.click(screen.getByRole('button', { name: /create account/i }))

    expect(await screen.findByText(/at least 8 characters/i)).toBeInTheDocument()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('shows error and blocks submission for invalid email format', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)

    render(
      <MemoryRouter initialEntries={['/register']}>
        <Register />
      </MemoryRouter>,
    )

    fireEvent.change(screen.getByPlaceholderText(/alicia gomez/i), { target: { value: 'Alice Smith' } })
    fireEvent.change(screen.getByPlaceholderText(/you@example\.com/i), { target: { value: 'notanemail' } })
    fireEvent.change(screen.getByPlaceholderText(/at least 8 characters/i), { target: { value: 'ValidPassword123!' } })
    fireEvent.change(screen.getByPlaceholderText(/confirm your password/i), { target: { value: 'ValidPassword123!' } })

    fireEvent.click(screen.getByRole('button', { name: /create account/i }))

    expect(await screen.findByText(/valid email address/i)).toBeInTheDocument()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('submits valid registration and displays success message banner', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          status: 'ok',
          message: 'Registration successful.',
          user: { id: 99, email: 'newuser@example.com', full_name: 'New User', role: 'Customer' },
        }),
      }),
    )

    render(
      <MemoryRouter initialEntries={['/register']}>
        <Register />
      </MemoryRouter>,
    )

    fireEvent.change(screen.getByPlaceholderText(/alicia gomez/i), { target: { value: 'New User' } })
    fireEvent.change(screen.getByPlaceholderText(/you@example\.com/i), { target: { value: 'newuser@example.com' } })
    fireEvent.change(screen.getByPlaceholderText(/at least 8 characters/i), { target: { value: 'SecurePass123!' } })
    fireEvent.change(screen.getByPlaceholderText(/confirm your password/i), { target: { value: 'SecurePass123!' } })

    fireEvent.click(screen.getByRole('button', { name: /create account/i }))

    expect(await screen.findByText(/account created successfully/i)).toBeInTheDocument()
  })

  it('displays backend duplicate email error message cleanly to user', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 409,
        json: async () => ({
          status: 'email_taken',
          message: 'An account with this email already exists.',
        }),
      }),
    )

    render(
      <MemoryRouter initialEntries={['/register']}>
        <Register />
      </MemoryRouter>,
    )

    fireEvent.change(screen.getByPlaceholderText(/alicia gomez/i), { target: { value: 'Existing User' } })
    fireEvent.change(screen.getByPlaceholderText(/you@example\.com/i), { target: { value: 'existing@example.com' } })
    fireEvent.change(screen.getByPlaceholderText(/at least 8 characters/i), { target: { value: 'SecurePass123!' } })
    fireEvent.change(screen.getByPlaceholderText(/confirm your password/i), { target: { value: 'SecurePass123!' } })

    fireEvent.click(screen.getByRole('button', { name: /create account/i }))

    expect(await screen.findByText(/already exists/i)).toBeInTheDocument()
  })
})
