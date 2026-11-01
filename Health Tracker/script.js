// 1. إعداد الاتصال بـ Supabase (استبدل القيم بالمعلومات الخاصة بمشروعك)
const SUPABASE_URL = 'https://dcdiqtzxhixjwmjivjzq.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_C-6G9wf5XPkyluhFQjCjSg_L1k8LV-O';
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// متغير لحفظ اسم المستخدم الحالي
let currentUser = '';

// التحقق من وجود اسم مسجل مسبقاً في ذاكرة المتصفح عند فتح الصفحة
window.addEventListener('DOMContentLoaded', () => {
    const savedName = localStorage.getItem('health_username');
    if (savedName) {
        currentUser = savedName;
        showDashboard(currentUser);
    }
});

// زر الدخول
document.getElementById('login-btn').addEventListener('click', () => {
    const usernameInput = document.getElementById('username-input').value.trim();
    if (usernameInput === '') {
        alert('الرجاء إدخال الاسم للمتابعة');
        return;
    }
    currentUser = usernameInput;
    localStorage.setItem('health_username', currentUser);
    showDashboard(currentUser);
});

// دالة إظهار لوحة التحكم
function showDashboard(username) {
    document.getElementById('login-card').style.display = 'none';
    const dashboard = document.getElementById('dashboard-content');
    dashboard.style.display = 'flex';
    document.getElementById('welcome-message').innerHTML = `أهلاً بك، ${username} ❤️ (سجل القراءات الخاص بك)`;
    
    fetchReadings();
}

// دالة تسجيل الخروج
function logout() {
    localStorage.removeItem('health_username');
    location.reload();
}

// 2. جلب القراءات الخاصة بالمستخدم الحالي فقط من Supabase
async function fetchReadings() {
    const tableBody = document.getElementById('readings-table-body');
    tableBody.innerHTML = '';

    const { data, error } = await supabaseClient
        .from('health_readings')
        .select('*')
        .eq('user_name', currentUser) // جلب قراءات هذا المستخدم فقط
        .order('id', { ascending: false });

    if (error) {
        console.error('خطأ في جلب البيانات:', error.message);
        return;
    }

    data.forEach(item => {
        const newRow = document.createElement('tr');
        const colorStyle = item.reading_type === 'ضغط الدم' ? 'color: #2563eb;' : 'color: #0d9488;';
        
        newRow.innerHTML = `
            <td>${item.reading_date}</td>
            <td><span style="${colorStyle} font-weight: bold;">${item.reading_type}</span></td>
            <td>${item.details}</td>
            <td><button class="delete-btn" onclick="deleteRow(${item.id}, this)">حذف</button></td>
        `;
        tableBody.appendChild(newRow);
    });
}

// 3. حفظ قراءة ضغط الدم مع اسم المستخدم في Supabase
const bpForm = document.getElementById('blood-pressure-form');
bpForm.addEventListener('submit', async function(event) {
    event.preventDefault();

    const date = document.getElementById('bp-date').value;
    const systolic = document.getElementById('Systolic').value;
    const diastolic = document.getElementById('diastolic').value;
    const pulse = document.getElementById('pulse').value || 'غير متوفر';
    const detailsText = `انقباضي: ${systolic} / انبساطي: ${diastolic} | النبض: ${pulse}`;

    const { error } = await supabaseClient
        .from('health_readings')
        .insert([{ 
            user_name: currentUser,
            reading_date: date, 
            reading_type: 'ضغط الدم', 
            details: detailsText 
        }]);

    if (error) {
        alert('حدث خطأ أثناء حفظ قراءة الضغط!');
        console.error(error);
        return;
    }

    bpForm.reset();
    fetchReadings();
});

// 4. حفظ قراءة السكر مع اسم المستخدم في Supabase
const sugarForm = document.getElementById('blood-sugar-form');
sugarForm.addEventListener('submit', async function(event) {
    event.preventDefault();

    const date = document.getElementById('sugar-date').value;
    const sugarLevel = document.getElementById('sugar-level').value;
    const timingSelect = document.getElementById('sugar-timing');
    const timingText = timingSelect.options[timingSelect.selectedIndex].text;
    const detailsText = `المستوى: ${sugarLevel} mg/dL (${timingText})`;

    const { error } = await supabaseClient
        .from('health_readings')
        .insert([{ 
            user_name: currentUser,
            reading_date: date, 
            reading_type: 'سكر الدم', 
            details: detailsText 
        }]);

    if (error) {
        alert('حدث خطأ أثناء حفظ قراءة السكر!');
        console.error(error);
        return;
    }

    sugarForm.reset();
    fetchReadings();
});

// 5. حذف قراءة من Supabase والجدول
async function deleteRow(id, button) {
    const { error } = await supabaseClient
        .from('health_readings')
        .delete()
        .eq('id', id);

    if (error) {
        alert('فشل في حذف السجل');
        return;
    }

    const row = button.closest('tr');
    row.remove();
}

function logout() {
    localStorage.removeItem('health_username'); // مسح الاسم من ذاكرة المتصفح
    location.reload(); // إعادة تحميل الصفحة لإظهار شاشة تسجيل الدخول من جديد
}