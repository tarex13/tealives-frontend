// src/pages/Auth.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation }               from 'react-router-dom';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup                       from 'yup';
import {
  login as apiLogin,    // POST /api/token/
  register as apiRegister,
  fetchCities,
  fetchBusinessTypes,
} from '../requests';
import api                           from '../api';
import { useAuth }                   from '../context/AuthContext';
import { useNotification }           from '../context/NotificationContext';
import PhoneInput                    from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import { FaGoogle, FaFacebook }      from 'react-icons/fa';
import { Helmet }                    from 'react-helmet-async';
import '../css/Auth.css';

const MINIMUM_AGE = 13;
const today       = new Date();
const cutoffDate  = new Date(
  today.getFullYear() - MINIMUM_AGE,
  today.getMonth(),
  today.getDate()
);

export default function Auth({ isOpen, setSidebarOpen }) {
  const [formType, setFormType]         = useState('login'); // 'login' | 'register' | 'forgot'
  const [step, setStep]                 = useState(0);       // register steps 0 or 1
  const [cities, setCities]             = useState([]);
  const [businessTypes, setBusinessTypes] = useState([]);
  const [usernameAvailable, setUsernameAvailable] = useState(null);
  const location = useLocation();
  const [resetUid, setResetUid]     = useState(null);
  const [resetToken, setResetToken] = useState(null);
  const { user, loginUser }             = useAuth();
  const { showNotification }            = useNotification();
  const navigate                        = useNavigate();

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      setSidebarOpen(true);
      showNotification('User already logged in!');
      navigate('/');
    }
  }, [user]);

  // Load dropdown data
  useEffect(() => {
    fetchCities()
      .then(setCities)
      .catch(console.error);
    fetchBusinessTypes()
      .then(setBusinessTypes)
      .catch(console.error);
  }, []);

    // Detect URL query for reset flow: ?formType=reset&uid=XXX&token=YYY
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const mode   = params.get('formType');
    const uid    = params.get('uid');
    const token  = params.get('token');
    if (mode === 'reset' && uid && token) {
      setFormType('reset');
      setResetUid(uid);
      setResetToken(token);
    }
    if (mode === 'register') {
      setFormType('register');
    }
  }, [location.search]);


  // New: schema for password reset (enter new password)
  const resetSchema = Yup.object({
    newPassword: Yup.string()
      .min(8, 'At least 8 chars')
      .matches(/[A-Z]/, 'One uppercase letter')
      .matches(/[a-z]/, 'One lowercase letter')
      .matches(/[0-9]/, 'One number')
      .matches(/[@$!%*?&]/, 'One special char')
      .required('Required'),
    confirmNewPassword: Yup.string()
      .oneOf([Yup.ref('newPassword')], 'Passwords must match')
      .required('Required'),
  });

  // Yup validation schemas
  const loginSchema = Yup.object({
    username: Yup.string().required('Required'),
    password: Yup.string().required('Required'),
  });

  const registerSchemaStep0 = Yup.object({
    username: Yup.string()
      .matches(/^[A-Za-z0-9_.]+$/, 'Only letters, numbers, underscores & dots')
      .min(3, 'At least 3 chars')
      .max(30, 'Up to 30 chars')
      .required('Required'),
    email: Yup.string().email('Invalid email').required('Required'),
    password: Yup.string()
      .min(8, 'At least 8 chars')
      .matches(/[A-Z]/, 'One uppercase letter')
      .matches(/[a-z]/, 'One lowercase letter')
      .matches(/[0-9]/, 'One number')
      .matches(/[@$!%*?&]/, 'One special char')
      .required('Required'),
    confirmPassword: Yup.string()
      .oneOf([Yup.ref('password')], 'Passwords must match')
      .required('Required'),
  });

  const registerSchemaStep1 = Yup.object({
    city: Yup.string().required('Required'),
    dob: Yup.date()
      .max(cutoffDate, `You must be ≥ ${MINIMUM_AGE}`)
      .required('Required'),
    phoneNumber: Yup.string().required('Required'),
    isBusiness: Yup.boolean(),
    businessName: Yup.string().when('isBusiness', {
      is: true,
      then: schema => schema.required('Required'),
      otherwise: schema => schema  // optional, keeps it un-required when isBusiness is false
    }),
    businessType: Yup.string().when('isBusiness', {
      is: true,
      then: schema => schema.required('Required'),
      otherwise: schema => schema
    }),
  });

  const forgotSchema = Yup.object({
    email: Yup.string().email('Invalid email').required('Required'),
  });

  // Helper to call username-check API
  const checkUsername = async (username, form) => {
    if (!username.trim()) return setUsernameAvailable(null);
    try {
      const res = await api.get(`check-username/?username=${username}`);
      setUsernameAvailable(res.data.available);
      if (!res.data.available) {
        form.setFieldError('username', 'Username is taken');
      }
    } catch {
      setUsernameAvailable(null);
    }
  };

  // Render the step-progress bar (only on register)
  const renderStepProgress = () => {
    if (formType !== 'register') return null;
    return (
      <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4 dark:bg-gray-700">
        <div
          className={`h-2.5 rounded-full transition-all duration-300 ${
            step === 0 ? 'bg-orange-400 w-1/2' : 'bg-orange-500 w-full'
          }`}
        />
      </div>
    );
  };

  return (
    <>
      {/* Dynamic page title */}
      <Helmet>
        <title>
          {formType === 'login' ? 'Login' :
           formType === 'register' ? 'Register' :
           'Reset Password'} | Tealives
        </title>
      </Helmet>

      <div className="auth-wrapper min-h-screen flex flex-col md:flex-row items-center justify-center bg-gradient-to-br dark:from-gray-800 from-gray-100 to-white relative overflow-hidden px-4">
        <div className="blob blob1" />
        <div className="blob blob2" />

        <div className="branding mb-10 md:mb-0 md:mr-20 text-center md:text-left z-10">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Tealives
          </h1>
          <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 leading-relaxed max-w-md">
            Life’s Happening in Your City.<br/>Join Conversations, Events & Marketplaces.
          </p>
        </div>

        <div className="form-card bg-white shadow-xl text-black rounded-lg p-6 w-full max-w-sm z-10">
          <Formik
            initialValues={{
              username: '',
              email: '',
              password: '',
              confirmPassword: '',
              city: '',
              dob: '',
              phoneNumber: '',
              isBusiness: false,
              businessName: '',
              businessType: '',
            }}
            validationSchema={
              formType === 'login'
                ? loginSchema
                : formType === 'register'
                ? (step === 0 ? registerSchemaStep0 : registerSchemaStep1)
                : formType === 'reset'
                ? resetSchema
                : forgotSchema
            }
            onSubmit={async (values, actions) => {
              const { setSubmitting, setFieldError, resetForm } = actions;
              setSubmitting(true);

              try {
                if (formType === 'login') {
                  // LOGIN
                  const ok = await loginUser({
                    username: values.username,
                    password: values.password
                  });
                  if (ok) {
                    setSidebarOpen(true);
                    navigate('/');
                  } else {
                    setFieldError('password', 'Invalid credentials');
                  }

                } else if (formType === 'register') {
                  if (step === 0) {
                    // STEP 0 → STEP 1
                    if (usernameAvailable !== true) {
                      setFieldError('username', 'Please choose an available username');
                    } else {
                      setStep(1);
                      // clear any step-0 touched state so step-1 fields start fresh
                      actions.setTouched({});
                    }
                  } else {
                    // FINAL REGISTER
                    const payload = {
                      username:      values.username,
                      email:         values.email,
                      password:      values.password,
                      city:          values.city,
                      dob:           values.dob,
                      phone_number:  values.phoneNumber,
                      is_business:   values.isBusiness,
                      ...(values.isBusiness && {
                        business_name: values.businessName,
                        business_type: values.businessType
                      })
                    };
                  // 1) Create the user
                  await apiRegister(payload);

                  // 2) Auto-login & send them to Edit Profile
                  const ok = await loginUser(
                    { username: values.username, password: values.password },
                    '/profile/edit'
                  );
                  if (!ok) {
                    // fallback: let them log in manually
                    showNotification('Account created! Please log in to continue.');
                    setFormType('login');
                    setStep(0);
                  }
                  }

                } else if (formType === 'forgot') {
                  // FORGOT PASSWORD
                  // (you can replace this with a real API call)
                  // FORGOT PASSWORD → call backend to send email
                  try {
                    await api.post('auth/password-reset/', {
                      email: values.email,
                    });
                    showNotification('Check your email for a reset link.', 'success');
                    setFormType('login');
                    setStep(0);
                    resetForm();
                  } catch (err) {
                    // map error back to the email field if possible
                    setFieldError('email', 'Unable to send reset link.');
                    showNotification('Failed to send reset link.', 'error');
                  }
 
                } else if (formType === 'reset') {
                  // RESET CONFIRM: call backend with uid, token & new password
                  try {
                    await api.post('auth/password-reset-confirm/', {
                      uid:          resetUid,
                      token:        resetToken,
                      new_password: values.newPassword
                    });
                    showNotification('Password updated! Please log in.', 'success');
                    // clear out reset state
                    setFormType('login');
                    setResetUid(null);
                    setResetToken(null);
                    resetForm();
                  } catch (err) {
                    setFieldError('newPassword', 'Invalid or expired link.');
                  }
                }
                
              } catch (err) {
                // map server errors to fields
                if (err.response?.data) {
                  Object.entries(err.response.data).forEach(([field, msg]) => {
                    setFieldError(field, Array.isArray(msg) ? msg.join(' ') : msg);
                    showNotification(msg);
                  });
                } else {
                  showNotification('Something went wrong. Please try again.');
                }
              } finally {
                setSubmitting(false);
              }
            }}
          >
            {formik => (
              <Form className="space-y-4">
                <h2 className="text-center text-lg font-medium capitalize">
                  {formType === 'login'
                    ? 'Login'
                    : formType === 'register'
                    ? `Register – Step ${step + 1} of 2`
                    : 'Reset Password'}
                </h2>

                {renderStepProgress()}

                {/* LOGIN */}
                {formType === 'login' && (
                  <>
                    <Field
                      name="username"
                      type="text"
                      placeholder="Username or Email"
                      className="input-style"
                    />
                    <ErrorMessage name="username" component="div" className="text-red-600 text-sm"/>
                    <Field
                      name="password"
                      type="password"
                      placeholder="Password"
                      className="input-style"
                    />
                    <ErrorMessage name="password" component="div" className="text-red-600 text-sm"/>
                  </>
                )}

                {/* REGISTER STEP 0 */}
                {formType === 'register' && step === 0 && (
                  <>
                    <Field name="username">
                      {({ field, form }) => (
                        <input
                          {...field}
                          type="text"
                          placeholder="Username"
                          className="input-style"
                          onBlur={async e => {
                            field.onBlur(e);
                            await checkUsername(field.value, form);
                          }}
                        />
                      )}
                    </Field>
                    <ErrorMessage name="username" component="div" className="text-red-600 text-sm"/>
                    {formik.values.username && usernameAvailable !== null && (
                      <p className={`text-sm ${
                        usernameAvailable ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {usernameAvailable
                          ? '✅ Username is available'
                          : '❌ Username is taken'}
                      </p>
                    )}

                    <Field
                      name="email"
                      type="email"
                      placeholder="Email"
                      className="input-style"
                    />
                    <ErrorMessage name="email" component="div" className="text-red-600 text-sm"/>

                    <Field
                      name="password"
                      type="password"
                      placeholder="Password"
                      className="input-style"
                    />
                    <ErrorMessage name="password" component="div" className="text-red-600 text-sm"/>

                    <Field
                      name="confirmPassword"
                      type="password"
                      placeholder="Confirm Password"
                      className="input-style"
                    />
                    <ErrorMessage name="confirmPassword" component="div" className="text-red-600 text-sm"/>

                    <div className="flex items-center">
                      <Field name="isBusiness" type="checkbox" />
                      <label htmlFor="isBusiness" className="ml-2 text-sm">
                        Register as Business
                      </label>
                    </div>

                    <p className="text-xs text-gray-500 text-center mt-1">
                      By signing up, you agree to our{' '}
                      <a href="/terms" className="text-blue-600 hover:underline">Terms</a>{' '}
                      and{' '}
                      <a href="/privacy" className="text-blue-600 hover:underline">Privacy Policy</a>.
                    </p>
                  </>
                )}

                {/* REGISTER STEP 1 */}
                {formType === 'register' && step === 1 && (
                  <>
                    <Field as="select" name="city" className="input-style">
                      <option value="">Select your city</option>
                      {cities.map(c => (
                        <option key={c} value={c}>
                          {c.charAt(0).toUpperCase() + c.slice(1)}
                        </option>
                      ))}
                    </Field>
                    <ErrorMessage name="city" component="div" className="text-red-600 text-sm"/>

                    <Field name="dob" type="date" className="input-style" />
                    <ErrorMessage name="dob" component="div" className="text-red-600 text-sm"/>

                    <PhoneInput
                      defaultCountry="CA"
                      value={formik.values.phoneNumber}
                      onChange={val => formik.setFieldValue('phoneNumber', val)}
                      className="input-style"
                    />
                    <ErrorMessage name="phoneNumber" component="div" className="text-red-600 text-sm"/>

                    {formik.values.isBusiness && (
                      <>
                        <Field
                          name="businessName"
                          type="text"
                          placeholder="Business Name"
                          className="input-style"
                        />
                        <ErrorMessage name="businessName" component="div" className="text-red-600 text-sm"/>

                        <Field as="select" name="businessType" className="input-style">
                          <option value="">Select Business Type</option>
                          {businessTypes.map(bt => (
                            <option key={bt} value={bt}>
                              {bt.charAt(0).toUpperCase() + bt.slice(1)}
                            </option>
                          ))}
                        </Field>
                        <ErrorMessage name="businessType" component="div" className="text-red-600 text-sm"/>
                      </>
                    )}
                  </>
                )}

                {/* FORGOT */}
               

                {formType === 'forgot' && (
                  <>
                    <Field
                      name="email"
                      type="email"
                      placeholder="Email"
                      className="input-style"
                    />
                    <ErrorMessage name="email" component="div" className="text-red-600 text-sm"/>
                  </>
                )}

                {/* RESET */} 
                {formType === 'reset' && (
                  <>
                    <Field
                      name="newPassword"
                      type="password"
                      placeholder="New Password"
                      className="input-style"
                    />
                    <ErrorMessage name="newPassword" component="div" className="text-red-600 text-sm"/>
                    <Field
                      name="confirmNewPassword"
                      type="password"
                      placeholder="Confirm New Password"
                      className="input-style"
                    />
                    <ErrorMessage name="confirmNewPassword" component="div" className="text-red-600 text-sm"/>
                  </>
                )}

                {/* Navigation Buttons */}
                <div className="flex gap-2">
                  {formType === 'register' && step > 0 && (
                    <button
                      type="button"
                      onClick={() => { setStep(s => s - 1); }}
                      className="flex-1 bg-gray-300 text-black py-2 rounded hover:bg-gray-400"
                    >
                      Back
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={formik.isSubmitting}
                    className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-medium py-2 rounded transition"
                  >
                       {{
                          login:    'Log In',
                          register: step === 0 ? 'Next' : 'Sign Up',
                          forgot:   'Send Reset Link',
                          reset:    'Set New Password'
                        }[formType]}
                  </button>
                </div>

                {/* Switch Links */}
                <div className="text-xs text-center text-gray-500 space-x-2 mt-4">
                  {formType !== 'login' && (
                    <span className="text-blue-600 cursor-pointer" onClick={() => {
                      setFormType('login');
                      setStep(0);
                      formik.resetForm();
                    }}>Back to Login</span>
                  )}
                  {formType !== 'register' && (
                    <span className="text-blue-600 cursor-pointer" onClick={() => {
                      setFormType('register');
                      setStep(0);
                      formik.resetForm();
                    }}>Sign Up</span>
                  )}
                  {formType !== 'forgot' && (
                    <span className="text-blue-600 cursor-pointer" onClick={() => {
                      setFormType('forgot');
                      setStep(0);
                      formik.resetForm();
                    }}>Forgot?</span>
                  )}
                </div>

                {/* Social Icons */}
                <div className="flex justify-center items-center gap-4 mt-2">
                  <FaGoogle size={20} className="text-gray-700 cursor-pointer hover:text-orange-500"/>
                  <FaFacebook size={20} className="text-gray-700 cursor-pointer hover:text-blue-600"/>
                </div>

                {/* Explore as Guest */}
                <button
                  type="button"
                  onClick={() => navigate('/')}
                  className="text-sm w-full mt-4 text-gray-600 underline hover:text-gray-800 transition"
                >
                  Explore as Guest
                </button>
              </Form>
            )}
          </Formik>
        </div>
      </div>
    </>
  );
}
