require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const { registerUser, loginUser, getUserProfile, protect } = require('./auth');

const app = express();
app.use(cors());
app.use(express.json());

// اتصال به Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// تست اولیه اتصال به دیتابیس
(async () => {
    const { data, error } = await supabase.from('customers').select('*');
    if (error) {
        console.error('❌ مشکل در اتصال به Supabase:', error.message);
    } else {
        console.log('✅ اتصال به Supabase موفق بود، تعداد کاربران:', data.length);
    }
})();

// تست اتصال سرور
app.get('/', (req, res) => {
    res.send('✅ API is running...');
});

// دریافت همه مشتری‌ها (نیاز به توکن)
app.get('/customers', protect, async (req, res) => {
    const { data, error } = await supabase.from('customers').select('*');
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
});

// دریافت اطلاعات کاربر فعلی (نیاز به توکن)
app.get('/customers/me', protect, async (req, res) => {
    const userId = req.user.id;
    const { data, error } = await supabase.from('customers').select('*').eq('id', userId).single();
    if (error) return res.status(500).json({ error: error.message });
    if (!data) return res.status(404).json({ error: 'کاربر یافت نشد' });
    res.json(data);
});

// ویرایش اطلاعات مشتری (نیاز به توکن)
app.put('/customers/:id', protect, async (req, res) => {
    const { id } = req.params;
    const { email } = req.body;
    const { data, error } = await supabase.from('customers').update({ email }).eq('id', id);
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
});

// حذف مشتری (نیاز به توکن)
app.delete('/customers/:id', protect, async (req, res) => {
    const { id } = req.params;
    const { error } = await supabase.from('customers').delete().eq('id', id);
    if (error) return res.status(500).json({ error: error.message });
    res.send('✅ کاربر با موفقیت حذف شد');
});

// روت‌های احراز هویت
app.post('/register', registerUser);
app.post('/login', loginUser);
app.get('/profile', getUserProfile);

// راه‌اندازی سرور
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server is running on http://localhost:${PORT}`);
});

console.log('🔹 Supabase URL:', process.env.SUPABASE_URL);
console.log('🔹 Supabase Key:', process.env.SUPABASE_KEY ? '✅ موجود است' : '❌ کلید تعریف نشده');