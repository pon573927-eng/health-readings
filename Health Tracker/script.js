// 1. إعداد الاتصال بقاعدة بيانات Supabase
// (تأكد من استبدال الروابط ببيانات مشروعك الحقيقية)
const SUPABASE_URL = 'https://dcdiqtzxhixjwmjivjzq.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_C-6G9wf5XPkyluhFQjCjSg_L1k8LV-O';

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// متغير لتخزين اسم المستخدم الحالي
let currentUser = localStorage.getItem('health_username') || '';

// عند تحميل الصفحة، التحقق مما إذا كان المستخدم مسجلاً لدخول سابق
document.addEventListener('DOMContentLoaded', () => {
    if (currentUser) {
        showDashboard(currentUser);
    } else {
        showLogin();
    }

    // ربط زر تسجيل الدخول
    const loginBtn = document.getElementById('login-btn');
    if (loginBtn) {
        loginBtn.addEventListener('click', handleLogin);
    }

    // ربط نموذج ضغط الدم
    const bpForm = document.getElementById('blood-pressure-form');
    if (bpForm) {
        bpForm.addEventListener('submit', handleSaveBloodPressure);
    }

    // ربط نموذج سكر الدم
    const sugarForm = document.getElementById('blood-sugar-form');
    if (sugarForm) {
        sugarForm.addEventListener('submit', handleSaveBloodSugar);
    }
});

// وظيفة تسجيل الدخول
function handleLogin() {
    const usernameInput = document.getElementById('username-input').value.trim();
    
    if (usernameInput === '') {
        alert('الرجاء إدخال اسم المستخدم للمتابعة');
        return;
    }
    
    currentUser = usernameInput;
    localStorage.setItem('health_username', currentUser);
    showDashboard(currentUser);
}

// إظهار لوحة التحكم وإخفاء بطاقة الدخول
function showDashboard(username) {
    const loginCard = document.getElementById('login-card');
    if (loginCard) loginCard.style.display = 'none';

    const dashboard = document.getElementById('dashboard-content');
    if (dashboard) {
        dashboard.style.display = 'flex';
        dashboard.style.flexDirection = 'column';
        dashboard.style.alignItems = 'center';
    }
    
    const welcomeMsg = document.getElementById('welcome-message');
    if (welcomeMsg) {
        welcomeMsg.innerHTML = `أهلاً بك، ${username} ❤️ (سجل القراءات الخاص بك)`;
    }
    
    fetchReadings();
}

// إظهار شاشة تسجيل الدخول
function showLogin() {
    const loginCard = document.getElementById('login-card');
    if (loginCard) loginCard.style.display = 'block';

    const dashboard = document.getElementById('dashboard-content');
    if (dashboard) dashboard.style.display = 'none';
}

// وظيفة تسجيل الخروج
function logout() {
    localStorage.removeItem('health_username');
    currentUser = '';
    location.reload();
}

// 2. حفظ قراءة ضغط الدم في Supabase
async function handleSaveBloodPressure(e) {
    e.preventDefault();

    const date = document.getElementById('bp-date').value;
    const systolic = document.getElementById('Systolic').value;
    const diastolic = document.getElementById('diastolic').value;
    const pulse = document.getElementById('pulse').value;

    const detailsText = `الضغط: ${systolic}/${diastolic} | النبض: ${pulse || 'غير محدد'}`;

    const { error } = await supabaseClient
        .from('health_readings')
        .insert([
            {
                user_name: currentUser,
                reading_date: date,
                reading_type: 'ضغط الدم',
                details: detailsText
            }
        ]);

    if (error) {
        alert('حدث خطأ أثناء حفظ قراءة الضغط!');
        console.error(error);
    } else {
        alert('تم حفظ قراءة الضغط بنجاح!');
        e.target.reset();
        fetchReadings();
    }
}

// 3. حفظ قراءة سكر الدم في Supabase
async function handleSaveBloodSugar(e) {
    e.preventDefault();

    const date = document.getElementById('sugar-date').value;
    const level = document.getElementById('sugar-level').value;
    const timing = document.getElementById('sugar-timing').value;

    const timingTexts = {
        'fasting': 'صائم (صباحاً)',
        'before-meal': 'قبل الأكل',
        'after-meal': 'بعد الأكل (بساعتين)',
        'bedtime': 'قبل النوم',
        'random': 'عشوائي'
    };

    const detailsText = `المستوى: ${level} mg/dL | الوقت: ${timingTexts[timing] || timing}`;

    const { error } = await supabaseClient
        .from('health_readings')
        .insert([
            {
                user_name: currentUser,
                reading_date: date,
                reading_type: 'سكر الدم',
                details: detailsText
            }
        ]);

    if (error) {
        alert('حدث خطأ أثناء حفظ قراءة السكر!');
        console.error(error);
    } else {
        alert('تم حفظ قراءة السكر بنجاح!');
        e.target.reset();
        fetchReadings();
    }
}

// 4. جلب وعرض القراءات الخاصة بالمستخدم الحالي فقط
async function fetchReadings() {
    const tableBody = document.getElementById('readings-table-body');
    if (!tableBody) return;

    tableBody.innerHTML = '<tr><td colspan="4">جاري تحميل البيانات...</td></tr>';

    const { data, error } = await supabaseClient
        .from('health_readings')
        .select('*')
        .eq('user_name', currentUser)
        .order('reading_date', { ascending: false });

    if (error) {
        console.error('خطأ في جلب البيانات:', error);
        tableBody.innerHTML = '<tr><td colspan="4" style="color: red;">خطأ في جلب البيانات</td></tr>';
        return;
    }

    tableBody.innerHTML = '';

    if (data.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="4">لا توجد قراءات مسجلة حتى الآن</td></tr>';
        return;
    }

data.forEach((reading) => {
        const row = document.createElement('tr');
        
        row.innerHTML = `
            <td>${reading.reading_date}</td>
            <td>${reading.reading_type}</td>
            <td>${reading.details}</td>
            <td>
                <button class="delete-btn" onclick="deleteRow('${reading.id}')">حذف</button>
                <button class="edit-btn" onclick="editRow('${reading.id}', '${reading.reading_type}', '${reading.details}')" style="background-color: #3b82f6; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer; font-size: 12px; margin-right: 5px;">تعديل</button>
            </td>
        `;
        tableBody.appendChild(row);
    }); 
}

// دالة التعديل المحدثة بالنافذة الجميلة
async function editRow(id, type, currentDetails) {
    const newDetails = await showCustomModal(
        `تعديل تفاصيل (${type})`, 
        'قم بتعديل التفاصيل أدناه ثم اضغط حفظ:', 
        true, 
        currentDetails
    );
    
    if (newDetails === null || newDetails.trim() === '') return;

    const { error } = await supabaseClient
        .from('health_readings')
        .update({ details: newDetails })
        .eq('id', id);

    if (error) {
        alert('فشل في تحديث السجل!');
        console.error(error);
    } else {
        fetchReadings(); // تحديث الجدول فوراً
    }
}

// دالة الحذف المحدثة بالنافذة الجميلة
async function deleteRow(id) {
    const confirmed = await showCustomModal(
        'تأكيد الحذف', 
        'هل أنت متأكد من رغبتك في حذف هذا السجل نهائياً؟ لا يمكن التراجع عن هذا الإجراء.', 
        false
    );

    if (!confirmed) return;

    const { error } = await supabaseClient
        .from('health_readings')
        .delete()
        .eq('id', id);

    if (error) {
        alert('فشل في حذف السجل!');
        console.error(error);
        return;
    }

    fetchReadings();
}
// دالة مساعدة لفتح النافذة المنبثقة بتصميم أنيق
function showCustomModal(title, description, showInput, initialValue) {
    return new Promise((resolve) => {
        const modal = document.getElementById('custom-modal');
        const modalTitle = document.getElementById('modal-title');
        const modalDesc = document.getElementById('modal-desc');
        const modalInput = document.getElementById('modal-input');
        const confirmBtn = document.getElementById('modal-confirm-btn');
        const cancelBtn = document.getElementById('modal-cancel-btn');

        modalTitle.innerText = title;
        modalDesc.innerText = description;
        
        if (showInput) {
            modalInput.style.display = 'block';
            modalInput.value = initialValue || '';
        } else {
            modalInput.style.display = 'none';
        }

        modal.style.display = 'flex';
        if (showInput) modalInput.focus();

        // تنظيف الأحداث القديمة لتجنب التكرار
        const newConfirmBtn = confirmBtn.cloneNode(true);
        const newCancelBtn = cancelBtn.cloneNode(true);
        confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
        cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn);

        document.getElementById('modal-confirm-btn').addEventListener('click', () => {
            modal.style.display = 'none';
            resolve(showInput ? document.getElementById('modal-input').value : true);
        });

        document.getElementById('modal-cancel-btn').addEventListener('click', () => {
            modal.style.display = 'none';
            resolve(null);
        });
    });
}
async function exportArabicPDF() {
    try {
        // 1. جلب البيانات من Supabase للمستخدم الحالي
        const { data, error } = await supabaseClient
            .from('health_readings')
            .select('*')
            .eq('user_name', currentUser)
            .order('reading_date', { ascending: false });

        if (error) {
            await showCustomModal('خطأ', 'حدث خطأ أثناء جلب البيانات من قاعدة البيانات!', false);
            console.error(error);
            return;
        }

        if (!data || data.length === 0) {
            await showCustomModal('تنبيه', 'لا توجد قراءات مسجلة لتصديرها!', false);
            return;
        }

        // 2. إنشاء عنصر مؤقت (div) لترتيب التقرير وتصميم الجدول بشكل احترافي يدعم اللغة العربية بالكامل
        const reportDiv = document.createElement('div');
        reportDiv.style.direction = 'rtl';
        reportDiv.style.padding = '20px';
        reportDiv.style.fontFamily = 'Cairo, sans-serif';
        reportDiv.style.backgroundColor = '#ffffff';
        reportDiv.style.color = '#333333';

        // تصميم محتوى التقرير (العنوان، اسم المستخدم، والتاريخ)
        let htmlContent = `
            <div style="text-align: center; margin-bottom: 20px;">
                <h2 style="color: #2563eb; margin: 0 0 5px 0;">سجل متابعة الصحة الشخصي</h2>
                <p style="font-size: 14px; color: #666; margin: 0;">المستخدم: <strong>${currentUser}</strong></p>
                <hr style="border: 0; border-top: 1px solid #e5e7eb; margin-top: 15px;">
            </div>
            <table style="width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 12px;">
                <thead>
                    <tr style="background-color: #3b82f6; color: white;">
                        <th style="padding: 10px; border: 1px solid #d1d5db; text-align: center;">#</th>
                        <th style="padding: 10px; border: 1px solid #d1d5db; text-align: center;">التاريخ والوقت</th>
                        <th style="padding: 10px; border: 1px solid #d1d5db; text-align: center;">نوع الفحص</th>
                        <th style="padding: 10px; border: 1px solid #d1d5db; text-align: center;">النتيجة / التفاصيل</th>
                    </tr>
                </thead>
                <tbody>
        `;

        // تعبئة البيانات داخل صفوف الجدول
        data.forEach((reading, index) => {
            htmlContent += `
                <tr>
                    <td style="padding: 8px; border: 1px solid #d1d5db; text-align: center;">${index + 1}</td>
                    <td style="padding: 8px; border: 1px solid #d1d5db; text-align: center;">${reading.reading_date || ''}</td>
                    <td style="padding: 8px; border: 1px solid #d1d5db; text-align: center;">${reading.reading_type || ''}</td>
                    <td style="padding: 8px; border: 1px solid #d1d5db; text-align: center;">${reading.details || ''}</td>
                </tr>
            `;
        });

        htmlContent += `
                </tbody>
            </table>
        `;

        reportDiv.innerHTML = htmlContent;

        // 3. إعدادات مكتبة html2pdf لتصدير العنصر المؤقت كملف PDF
        const options = {
            margin:       10,
            filename:     `Health_Report_${currentUser}.pdf`,
            image:        { type: 'jpeg', quality: 0.98 },
            html2canvas:  { scale: 2, useCORS: true },
            jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };

        // 4. تنفيذ التحويل وتنزيل الملف مباشرة
        await html2pdf().from(reportDiv).set(options).save();

        // إظهار نافذة النجاح في وسط الشاشة
        await showCustomModal('نجاح العملية', 'تم تحميل التقرير باللغة العربية بصيغة PDF بنجاح!', false);

    } catch (err) {
        console.error('PDF Export Error:', err);
        await showCustomModal('خطأ', 'حدث خطأ أثناء إنشاء ملف الـ PDF: ' + err.message, false);
    }
}
