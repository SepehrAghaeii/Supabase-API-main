const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// ثبت‌نام کاربر جدید
const registerUser = async (req, res) => {
    const { email, password } = req.body;
    const { data: authData, error: authError } = await supabase.auth.signUp({ email, password });
    if (authError) return res.status(400).json({ error: authError.message });

    const { data: userData, error: userError } = await supabase
        .from('customers')
        .insert([{ id: authData.user.id, email }]);
    if (userError) return res.status(400).json({ error: 'خطا در ذخیره در دیتابیس: ' + userError.message });

    res.status(201).json({ message: 'ثبت‌نام و ذخیره در دیتابیس موفق بود', user: userData });
};

// ورود کاربر و گرفتن توکن
const loginUser = async (req, res) => {
    const { email, password } = req.body;
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return res.status(400).json({ error: error.message });

    res.status(200).json({ message: 'ورود موفقیت‌آمیز بود', data });
};

// دریافت اطلاعات کاربر لاگین‌شده
const getUserProfile = async (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'توکن ارسال نشده است' });

    const { data, error } = await supabase.auth.getUser(token);
    if (error) return res.status(400).json({ error: error.message });

    res.json({ user: data });
};

// Middleware برای محافظت از روت‌ها
const protect = async (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'لطفاً توکن ارسال کنید' });
    const { data, error } = await supabase.auth.getUser(token);
    if (error) return res.status(401).json({ error: 'توکن نامعتبر است' });
    req.user = data.user;
    next();
};

module.exports = { registerUser, loginUser, getUserProfile, protect };