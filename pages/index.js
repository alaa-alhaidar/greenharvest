import Head from 'next/head';
import { useState, useCallback, useMemo } from 'react';
import { categories, products } from '../lib/products';

const WA_NUMBER  = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '49170123456';
const STORE_NAME = process.env.NEXT_PUBLIC_STORE_NAME      || 'مواسم الخير';
const LANGS      = ['DE', 'EN', 'AR', 'FR'];

/* ─── Stars ─────────────────────────────────────────────────────── */
function Stars({ rating }) {
  return (
    <div style={{ display: 'flex', gap: 2 }}>
      {[1,2,3,4,5].map(i => {
        const full = i <= Math.floor(rating);
        const half = !full && i - 0.5 <= rating;
        return (
          <span key={i} style={{ fontSize: 13, color: full || half ? '#F59E0B' : '#DDD8CE', opacity: half ? 0.6 : 1 }}>★</span>
        );
      })}
    </div>
  );
}

/* ─── WhatsApp Icon ──────────────────────────────────────────────── */
function WaIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
  );
}

/* ─── Page ───────────────────────────────────────────────────────── */
export default function Home() {
  const [activeCat,  setActiveCat]  = useState('all');
  const [search,     setSearch]     = useState('');
  const [cart,       setCart]       = useState({});
  const [panelStep,  setPanelStep]  = useState('summary'); // 'summary' | 'form' | 'success'
  const [langIdx,    setLangIdx]    = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', address: '', notes: '' });
  const [errors, setErrors] = useState({});

  /* ── derived ── */
  const filtered = useMemo(() => {
    let list = activeCat === 'all' ? products : products.filter(p => p.category === activeCat);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(p => p.name.toLowerCase().includes(q) || p.origin.toLowerCase().includes(q));
    }
    return list;
  }, [activeCat, search]);

  const cartEntries = useMemo(
    () => Object.entries(cart).filter(([,q]) => q > 0).map(([id, qty]) => ({
      ...products.find(p => p.id === id), qty,
    })),
    [cart]
  );
  const cartCount = cartEntries.reduce((s, i) => s + i.qty, 0);
  const cartTotal = cartEntries.reduce((s, i) => s + i.price * i.qty, 0);

  /* ── cart ── */
  const addToCart = useCallback((id, e) => {
    e.stopPropagation();
    setCart(prev => ({ ...prev, [id]: (prev[id] || 0) + 1 }));
  }, []);

  const changeQty = useCallback((id, delta) => {
    setCart(prev => {
      const next = { ...prev, [id]: Math.max(0, (prev[id] || 0) + delta) };
      if (!next[id]) delete next[id];
      return next;
    });
  }, []);

  /* ── submit ── */
  const validate = () => {
    const e = {};
    if (!form.name.trim())    e.name    = 'Required';
    if (!form.phone.trim())   e.phone   = 'Required';
    if (!form.address.trim()) e.address = 'Required';
    setErrors(e);
    return !Object.keys(e).length;
  };

  const sendOrder = async () => {
    if (!validate()) return;
    setSubmitting(true);
    try {
      // POST to our secure server-side API route — browser never touches Firebase
      const res = await fetch('/api/order', {
        method:  'POST',
        headers: {
          'Content-Type': 'application/json',
          // Secret header — server rejects requests without this
          'x-api-secret': process.env.NEXT_PUBLIC_API_SECRET || '',
        },
        body: JSON.stringify({
          customer: { ...form },
          items:    cartEntries.map(i => ({ id: i.id, qty: i.qty })),
          // NOTE: we do NOT send prices — the server looks them up itself
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        // Show field-level errors if validation failed
        if (res.status === 422 && data.fields) {
          setErrors(data.fields);
        } else {
          alert(data.error || 'Something went wrong. Please try again.');
        }
        return;
      }

      // Build WhatsApp message using server-confirmed values
      const { orderId, total } = data;
      const lines = cartEntries
        .map(i => `  • ${i.name} x${i.qty} — €${(i.price * i.qty).toFixed(2)}`)
        .join('\n');
      const msg = encodeURIComponent(
        `🌿 *طلب جديد — ${STORE_NAME}*\nرقم الطلب: #${orderId}\n\n` +
        `👤 *الاسم:* ${form.name}\n📞 *الهاتف:* ${form.phone}\n📍 *العنوان:* ${form.address}\n` +
        (form.notes ? `📝 *ملاحظات:* ${form.notes}\n` : '') +
        `\n*المنتجات:*\n${lines}\n\n💰 *المجموع: €${total.toFixed(2)}*\n💳 *الدفع: عند الاستلام*`
      );
      window.open(`https://wa.me/${WA_NUMBER}?text=${msg}`, '_blank');
      setPanelStep('success');

    } catch (err) {
      console.error(err);
      alert('Network error. Please check your connection and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const resetAll = () => {
    setCart({});
    setForm({ name: '', phone: '', address: '', notes: '' });
    setErrors({});
    setPanelStep('summary');
  };

  /* ── shared input style ── */
  const inputStyle = (hasErr) => ({
    width: '100%', padding: '11px 13px',
    background: hasErr ? '#FFF5F5' : '#F6F3EE',
    border: `1.5px solid ${hasErr ? '#E57373' : '#E2DDD5'}`,
    borderRadius: 10, fontSize: 14, fontWeight: 600, color: '#222',
    outline: 'none', fontFamily: "'Nunito', sans-serif",
  });

  /* ─────────────────────────────────────────────────────────────
     RENDER
  ───────────────────────────────────────────────────────────── */
  return (
    <>
      <Head>
        <title>{STORE_NAME} — منتجات طبيعية</title>
        <meta name="description" content={`اطلب من ${STORE_NAME} — منتجات طبيعية توصل لباب بيتك`} />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>

      <div style={{ minHeight: '100vh', background: '#EDEAE3', fontFamily: "'Nunito', sans-serif" }}>

        {/* ══════════ TOP NAV ══════════ */}
        <nav style={{
          background: '#fff',
          borderBottom: '1px solid #E5E1D9',
          padding: '0 40px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          height: 90,
          position: 'sticky', top: 0, zIndex: 50,
          boxShadow: '0 1px 8px rgba(0,0,0,0.06)',
        }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
            <img 
              src="/brand/logo17.png" 
              alt="مواسم الخير"
              style={{
                width: 50, height: 50, borderRadius: 10,
                objectFit: 'cover'
              }}
            />
            <div>
              <div style={{ fontSize: 22, fontWeight: 900, color: '#142019', letterSpacing: -0.5, lineHeight: 1.1 }}>
                {STORE_NAME}
              </div>
              <div style={{ fontSize: 11.5, color: '#8A8478', fontWeight: 600 }}>
                {products.length} منتج طبيعي
              </div>
            </div>
          </div>

          {/* Search */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            background: '#F4F1EB', border: '1px solid #DEDAD3', borderRadius: 12,
            padding: '10px 16px', width: 340, flexShrink: 0,
          }}>
            <span style={{ color: '#AAA', fontSize: 15 }}>🔍</span>
            <input
              type="text"
              placeholder="Search products…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                flex: 1, border: 'none', background: 'transparent',
                fontSize: 14, fontWeight: 500, color: '#222', outline: 'none',
                fontFamily: "'Nunito', sans-serif",
              }}
            />
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              onClick={() => setLangIdx(i => (i + 1) % LANGS.length)}
              style={{
                padding: '8px 14px', background: '#fff', border: '1px solid #DEDAD2',
                borderRadius: 9, fontSize: 13, fontWeight: 800, color: '#444', cursor: 'pointer',
                boxShadow: '0 1px 3px rgba(0,0,0,0.07)', fontFamily: "'Nunito', sans-serif",
              }}
            >
              {LANGS[langIdx]}
            </button>
            <button
              onClick={() => window.open(`https://wa.me/${WA_NUMBER}`, '_blank')}
              style={{
                display: 'flex', alignItems: 'center', gap: 7, padding: '9px 18px',
                background: '#25D366', border: 'none', borderRadius: 10,
                fontSize: 14, fontWeight: 800, color: '#fff', cursor: 'pointer',
                fontFamily: "'Nunito', sans-serif",
              }}
            >
              <WaIcon size={16} /> WhatsApp
            </button>
            <button
              onClick={() => window.location = 'tel:+1234567890'}
              style={{
                display: 'flex', alignItems: 'center', gap: 7, padding: '9px 18px',
                background: '#1C4A2B', border: 'none', borderRadius: 10,
                fontSize: 14, fontWeight: 800, color: '#fff', cursor: 'pointer',
                fontFamily: "'Nunito', sans-serif",
              }}
            >
              📞 Call Us
            </button>
          </div>
        </nav>

        {/* ══════════ TWO-COLUMN BODY ══════════ */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 380px',
          gap: 28,
          padding: '28px 40px 60px',
          maxWidth: 1600,
          margin: '0 auto',
          alignItems: 'start',
        }}>

          {/* ════════ LEFT: PRODUCTS ════════ */}
          <div>
            {/* Category pills */}
            <div style={{ display: 'flex', gap: 9, marginBottom: 24, flexWrap: 'wrap' }}>
              {categories.map(c => (
                <button
                  key={c.id}
                  onClick={() => setActiveCat(c.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 7,
                    padding: '9px 20px', borderRadius: 50,
                    border: `1.5px solid ${c.id === activeCat ? '#1C4A2B' : '#DDD8CE'}`,
                    background: c.id === activeCat ? '#1C4A2B' : '#fff',
                    fontSize: 14, fontWeight: 700,
                    color: c.id === activeCat ? '#fff' : '#555',
                    cursor: 'pointer', transition: 'all .18s',
                    fontFamily: "'Nunito', sans-serif",
                  }}
                >
                  <span style={{ fontSize: 17 }}>{c.icon}</span>
                  {c.label}
                </button>
              ))}
            </div>

            {/* Product grid */}
            {!filtered.length ? (
              <div style={{ textAlign: 'center', padding: '80px 0', color: '#B0AAA1', fontWeight: 600, fontSize: 15 }}>
                No products found 🌿
              </div>
            ) : (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))',
                gap: 16,
              }}>
                {filtered.map(p => {
                  const inCart = (cart[p.id] || 0) > 0;
                  return (
                    <div
                      key={p.id}
                      style={{
                        background: '#fff', borderRadius: 18,
                        overflow: 'hidden',
                        border: '1px solid rgba(0,0,0,0.05)',
                        boxShadow: '0 2px 10px rgba(0,0,0,0.07)',
                        display: 'flex',
                        transition: 'transform .15s, box-shadow .15s',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.11)'; }}
                      onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 2px 10px rgba(0,0,0,0.07)'; }}
                    >
                      {/* Image */}
                      <div style={{
                        width: 130, flexShrink: 0, background: p.bg,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        position: 'relative', minHeight: 140,
                      }}>
                        {p.badge && (
                          <span style={{
                            position: 'absolute', top: 10, left: 10, zIndex: 2,
                            padding: '4px 10px', borderRadius: 8, fontSize: 11.5, fontWeight: 800,
                            background: p.badge === 'organic' ? '#1C4A2B' : p.badge === 'new' ? '#2563EB' : '#D97706',
                            color: '#fff',
                          }}>
                            {p.badge.charAt(0).toUpperCase() + p.badge.slice(1)}
                          </span>
                        )}
                        <span style={{ fontSize: 58, filter: 'drop-shadow(0 3px 8px rgba(0,0,0,0.12))' }}>
                          {p.emoji}
                        </span>
                      </div>

                      {/* Info */}
                      <div style={{ flex: 1, padding: '16px 16px 14px', display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <div style={{ fontSize: 16, fontWeight: 800, color: '#1A1A1A', lineHeight: 1.25 }}>{p.name}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12.5, color: '#8A8478', fontWeight: 600 }}>
                          <span>📍</span>{p.origin}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                          <Stars rating={p.stars} />
                          <span style={{ fontSize: 12, color: '#A09A93', fontWeight: 600 }}>({p.reviews})</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto', paddingTop: 10 }}>
                          <span style={{ fontSize: 18, fontWeight: 900, color: '#1A1A1A' }}>€{p.price.toFixed(2)}</span>
                          <button
                            onClick={e => addToCart(p.id, e)}
                            style={{
                              width: 36, height: 36,
                              background: inCart ? '#245E38' : '#1C4A2B',
                              borderRadius: 10, border: 'none', color: '#fff',
                              fontSize: inCart ? 16 : 24, fontWeight: inCart ? 900 : 300,
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              cursor: 'pointer', lineHeight: 1, transition: 'all .15s',
                              fontFamily: "'Nunito', sans-serif",
                            }}
                          >
                            {inCart ? '✓' : '+'}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ════════ RIGHT: ORDER PANEL ════════ */}
          <div style={{ position: 'sticky', top: 88 }}>
            <div style={{
              background: '#fff', borderRadius: 20,
              border: '1px solid #E5E1D9',
              boxShadow: '0 4px 24px rgba(0,0,0,0.09)',
              overflow: 'hidden',
            }}>
              {/* Panel header */}
              <div style={{
                padding: '20px 24px 16px',
                borderBottom: '1px solid #F0EDE7',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                background: '#FAFAF8',
              }}>
                <div style={{ fontSize: 18, fontWeight: 900, color: '#1A1A1A' }}>
                  {panelStep === 'success' ? '✅ Order Sent!' : panelStep === 'form' ? '📋 Delivery Details' : '🛒 Your Order'}
                </div>
                {cartCount > 0 && panelStep !== 'success' && (
                  <span style={{
                    background: '#1C4A2B', color: '#fff',
                    borderRadius: 20, padding: '3px 10px',
                    fontSize: 12, fontWeight: 800,
                  }}>
                    {cartCount} item{cartCount !== 1 ? 's' : ''}
                  </span>
                )}
              </div>

              <div style={{ padding: '18px 24px 24px', maxHeight: 'calc(100vh - 160px)', overflowY: 'auto' }}>

                {/* ── SUCCESS STATE ── */}
                {panelStep === 'success' && (
                  <div style={{ textAlign: 'center', padding: '8px 0' }}>
                    <div style={{
                      width: 64, height: 64, borderRadius: '50%',
                      background: 'rgba(37,211,102,0.12)', border: '2px solid rgba(37,211,102,0.35)',
                      color: '#25D366', fontSize: 28,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      margin: '0 auto 16px',
                    }}>✓</div>
                    <div style={{ fontSize: 17, fontWeight: 800, color: '#1A1A1A', marginBottom: 8 }}>
                      WhatsApp message opened!
                    </div>
                    <div style={{ fontSize: 13, color: '#8A8478', fontWeight: 600, lineHeight: 1.6, marginBottom: 20 }}>
                      Send it to confirm your order.<br />Pay cash on delivery.
                    </div>
                    {['Send the WhatsApp message', 'We prepare your order', 'Pay cash on delivery 💵'].map((t, i) => (
                      <div key={i} style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        background: '#F6F3EE', borderRadius: 10, padding: '10px 14px',
                        marginBottom: 8, fontSize: 13, fontWeight: 600, color: '#444', textAlign: 'left',
                      }}>
                        <span style={{
                          width: 22, height: 22, borderRadius: '50%',
                          background: '#1C4A2B', color: '#fff',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 11, fontWeight: 900, flexShrink: 0,
                        }}>{i + 1}</span>
                        {t}
                      </div>
                    ))}
                    <button
                      onClick={resetAll}
                      style={{
                        width: '100%', marginTop: 14, background: '#1C4A2B', color: '#fff',
                        border: 'none', borderRadius: 12, padding: 14,
                        fontSize: 15, fontWeight: 800, cursor: 'pointer', fontFamily: "'Nunito', sans-serif",
                      }}
                    >
                      Continue Shopping
                    </button>
                  </div>
                )}

                {/* ── CART SUMMARY ── */}
                {panelStep === 'summary' && (
                  <>
                    {cartEntries.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '36px 0', color: '#B0AAA1' }}>
                        <div style={{ fontSize: 44, marginBottom: 10 }}>🛒</div>
                        <div style={{ fontSize: 14, fontWeight: 700 }}>Your cart is empty</div>
                        <div style={{ fontSize: 12.5, marginTop: 5, fontWeight: 500 }}>Click + on any product to add it</div>
                      </div>
                    ) : (
                      <>
                        {/* Items */}
                        {cartEntries.map(item => (
                          <div key={item.id} style={{
                            display: 'flex', alignItems: 'center', gap: 12,
                            padding: '11px 0', borderBottom: '1px solid #F4F1EB',
                          }}>
                            <div style={{
                              width: 46, height: 46, background: item.bg || '#F4F1EB',
                              borderRadius: 11, display: 'flex', alignItems: 'center',
                              justifyContent: 'center', fontSize: 22, flexShrink: 0,
                            }}>
                              {item.emoji}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: 13.5, fontWeight: 800, color: '#1A1A1A', lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {item.name}
                              </div>
                              <div style={{ fontSize: 12, color: '#9A9490', fontWeight: 600, marginTop: 2 }}>
                                €{item.price.toFixed(2)} each
                              </div>
                            </div>
                            {/* Qty */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#F4F1EB', borderRadius: 9, padding: '4px 7px', flexShrink: 0 }}>
                              <button onClick={() => changeQty(item.id, -1)}
                                style={{ width: 24, height: 24, background: '#fff', border: '1px solid #E2DDD5', borderRadius: 7, fontSize: 15, fontWeight: 800, color: '#555', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontFamily: "'Nunito', sans-serif" }}>−</button>
                              <span style={{ fontSize: 14, fontWeight: 900, minWidth: 16, textAlign: 'center' }}>{item.qty}</span>
                              <button onClick={() => changeQty(item.id, 1)}
                                style={{ width: 24, height: 24, background: '#fff', border: '1px solid #E2DDD5', borderRadius: 7, fontSize: 15, fontWeight: 800, color: '#555', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontFamily: "'Nunito', sans-serif" }}>+</button>
                            </div>
                            <div style={{ fontSize: 14, fontWeight: 800, color: '#1A1A1A', minWidth: 54, textAlign: 'right', flexShrink: 0 }}>
                              €{(item.price * item.qty).toFixed(2)}
                            </div>
                          </div>
                        ))}

                        {/* Total */}
                        <div style={{
                          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                          padding: '16px 0 6px', borderTop: '2px solid #E5E1D9', marginTop: 4,
                        }}>
                          <span style={{ fontSize: 15, fontWeight: 700, color: '#666' }}>Total</span>
                          <span style={{ fontSize: 24, fontWeight: 900, color: '#1C4A2B' }}>€{cartTotal.toFixed(2)}</span>
                        </div>

                        {/* Payment note */}
                        <div style={{
                          display: 'flex', alignItems: 'center', gap: 7,
                          background: 'rgba(37,211,102,0.07)', border: '1px solid rgba(37,211,102,0.2)',
                          borderRadius: 9, padding: '9px 12px', marginTop: 12,
                          fontSize: 12.5, fontWeight: 700, color: '#1a7a42',
                        }}>
                          💵 Cash on Delivery — no online payment
                        </div>

                        <button
                          onClick={() => setPanelStep('form')}
                          style={{
                            width: '100%', marginTop: 14,
                            background: '#1C4A2B', color: '#fff',
                            border: 'none', borderRadius: 12, padding: 15,
                            fontSize: 15, fontWeight: 800, cursor: 'pointer',
                            fontFamily: "'Nunito', sans-serif",
                          }}
                        >
                          Place Order →
                        </button>
                      </>
                    )}
                  </>
                )}

                {/* ── DELIVERY FORM ── */}
                {panelStep === 'form' && (
                  <>
                    <button
                      onClick={() => setPanelStep('summary')}
                      style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, fontWeight: 700, color: '#8A8478', background: 'none', border: 'none', cursor: 'pointer', fontFamily: "'Nunito', sans-serif", marginBottom: 16, padding: 0 }}
                    >
                      ← Back to cart
                    </button>

                    {/* Mini summary */}
                    <div style={{
                      background: '#F6F3EE', borderRadius: 11, padding: '11px 14px',
                      marginBottom: 18, display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#666' }}>{cartCount} item{cartCount !== 1 ? 's' : ''}</span>
                      <span style={{ fontSize: 18, fontWeight: 900, color: '#1C4A2B' }}>€{cartTotal.toFixed(2)}</span>
                    </div>

                    {/* Fields */}
                    {[
                      { key: 'name',    label: 'Full Name *',        type: 'text', ph: 'Your full name' },
                      { key: 'phone',   label: 'Phone Number *',     type: 'tel',  ph: '+49 170 1234567' },
                      { key: 'address', label: 'Delivery Address *', type: 'area', ph: 'Street, City, ZIP' },
                      { key: 'notes',   label: 'Notes (optional)',    type: 'text', ph: 'Special requests?' },
                    ].map(f => (
                      <div key={f.key} style={{ marginBottom: 13 }}>
                        <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#8A8478', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          {f.label}
                        </label>
                        {f.type === 'area' ? (
                          <textarea rows={2} placeholder={f.ph} value={form[f.key]}
                            onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                            style={{ ...inputStyle(errors[f.key]), resize: 'none' }} />
                        ) : (
                          <input type={f.type} placeholder={f.ph} value={form[f.key]}
                            onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                            style={inputStyle(errors[f.key])} />
                        )}
                        {errors[f.key] && <span style={{ fontSize: 11.5, color: '#E57373', fontWeight: 600, marginTop: 3, display: 'block' }}>{errors[f.key]}</span>}
                      </div>
                    ))}

                    <div style={{
                      background: 'rgba(37,211,102,0.07)', border: '1px solid rgba(37,211,102,0.2)',
                      borderRadius: 10, padding: '10px 13px', fontSize: 12.5, fontWeight: 600, color: '#444',
                      lineHeight: 1.55, display: 'flex', gap: 8, marginBottom: 16,
                    }}>
                      <span style={{ fontSize: 16, flexShrink: 0 }}>📱</span>
                      <span>Order confirmed via WhatsApp. Pay cash on delivery.</span>
                    </div>

                    <button
                      onClick={sendOrder}
                      disabled={submitting}
                      style={{
                        width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9,
                        background: submitting ? '#1aad54' : '#25D366', color: '#fff',
                        border: 'none', borderRadius: 12, padding: 15,
                        fontSize: 15, fontWeight: 800, cursor: submitting ? 'not-allowed' : 'pointer',
                        opacity: submitting ? 0.75 : 1, fontFamily: "'Nunito', sans-serif",
                      }}
                    >
                      <WaIcon />
                      {submitting ? 'Sending…' : 'Send Order via WhatsApp'}
                    </button>
                  </>
                )}

              </div>
            </div>
          </div>
          {/* end right panel */}

        </div>
        {/* end two-column grid */}

      </div>
    </>
  );
}//https://www.canva.com/design/DAHCupo0NnQ/fXciitOmgquz5JhfCKVh5w/edit