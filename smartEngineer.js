const fs = require('fs-extra');
const path = require('path');
const ejs = require('ejs');

class SmartEngineer {
    constructor() {
        this.trainingData = [];
        this.learnedPatterns = {
            avgDifficulty: 0,
            popularMechanics: [],
            mechanicCombinations: new Map() // لتخزين تكرارات ازدواج الميكانيكيات
        };
        this.templateDir = path.join(__dirname, 'templates');
        this.outputDir = path.join(__dirname, 'generated');
        fs.ensureDirSync(this.outputDir);
    }

    /**
     * 1. التدريب: تحليل بيانات التدريب واستخلاص الأنماط
     * في نسخة متقدمة، هنا ستضع TensorFlow.js أو نموذج تعلم آلي.
     */
    train(trainingFilePath) {
        console.log('🧠 بدء عملية التدريب...');
        const rawData = fs.readFileSync(trainingFilePath, 'utf-8');
        this.trainingData = JSON.parse(rawData);
        
        // إعادة تعيين الأنماط
        this.learnedPatterns.popularMechanics = [];
        this.learnedPatterns.mechanicCombinations.clear();

        // حساب متوسط الصعوبة
        const totalDifficulty = this.trainingData.reduce((sum, t) => sum + (t.difficulty || 5), 0);
        this.learnedPatterns.avgDifficulty = totalDifficulty / this.trainingData.length;

        // تجميع الميكانيكيات الأكثر شيوعاً
        const mechanicCount = new Map();
        this.trainingData.forEach(template => {
            if (template.mechanics && Array.isArray(template.mechanics)) {
                template.mechanics.forEach(m => {
                    mechanicCount.set(m, (mechanicCount.get(m) || 0) + 1);
                });
                // تحليل الازدواجات (أزواج الميكانيكيات التي تظهر معاً)
                for (let i = 0; i < template.mechanics.length; i++) {
                    for (let j = i+1; j < template.mechanics.length; j++) {
                        const pair = [template.mechanics[i], template.mechanics[j]].sort().join('+');
                        this.learnedPatterns.mechanicCombinations.set(
                            pair,
                            (this.learnedPatterns.mechanicCombinations.get(pair) || 0) + 1
                        );
                    }
                }
            }
        });

        // ترتيب الميكانيكيات حسب الشيوع
        this.learnedPatterns.popularMechanics = Array.from(mechanicCount.entries())
            .sort((a, b) => b[1] - a[1])
            .map(entry => entry[0]);

        console.log('✅ اكتمل التدريب.');
        console.log(`   متوسط الصعوبة: ${this.learnedPatterns.avgDifficulty.toFixed(2)}`);
        console.log(`   أشهر 3 ميكانيكيات: ${this.learnedPatterns.popularMechanics.slice(0,3).join(', ')}`);
    }

    /**
     * 2. توليد المواصفات (Spec) بناءً على الأنماط المتعلمة.
     * هذا هو "الوصف المجرد" الذي سيُمرر إلى محرك القوالب.
     * يمكن تطويره لاحقاً ليستخدم نموذجاً توليدياً (GAN / VAE).
     */
    generateTemplateSpecification() {
        if (this.trainingData.length === 0) {
            throw new Error('يجب تدريب النموذج أولاً باستخدام train()');
        }

        console.log('📝 توليد مواصفات قالب جديد...');
        
        // خوارزمية بسيطة (لكن ذكية):
        // 1. اختر عدداً عشوائياً من الميكانيكيات بين 2 و 4
        const numMechanics = Math.floor(Math.random() * 3) + 2; // 2,3,4
        let selectedMechanics = [];
        
        // 2. حاول اختيار ميكانيكيات متوافقة (ظهرت معاً في بيانات التدريب)
        // إذا وجدت ازدواجات قوية، استخدمها كأساس
        const strongPairs = Array.from(this.learnedPatterns.mechanicCombinations.entries())
            .filter(([_, count]) => count >= 2) // ظهرت مرتين على الأقل
            .map(([pair, _]) => pair.split('+'));
        
        let seedPair = null;
        if (strongPairs.length > 0) {
            seedPair = strongPairs[Math.floor(Math.random() * strongPairs.length)];
            selectedMechanics.push(...seedPair);
        }

        // 3. أكمل العدد المطلوب بميكانيكيات شائعة (مع تجنب التكرار)
        while (selectedMechanics.length < numMechanics) {
            const candidate = this.learnedPatterns.popularMechanics[
                Math.floor(Math.random() * this.learnedPatterns.popularMechanics.length)
            ];
            if (!selectedMechanics.includes(candidate)) {
                selectedMechanics.push(candidate);
            }
        }

        // 4. تعديل الصعوبة حول المتوسط مع إضافة بعض التباين (تعلم من التباين في البيانات)
        const difficultyVariance = 1.5;
        const baseDifficulty = this.learnedPatterns.avgDifficulty;
        const adjustedDifficulty = baseDifficulty + (Math.random() * 2 - 1) * difficultyVariance;
        
        // 5. توليد اسم إبداعي (يمكن استخدام Markov chains لاحقاً)
        const namePrefixes = ['عالم', 'مملكة', 'قلعة', 'غابة', 'فضاء', 'كهف'];
        const nameSuffixes = ['الظلال', 'الألغاز', 'المغامرة', 'الخطر', 'الكنز', 'النجاة'];
        const generatedName = `${namePrefixes[Math.floor(Math.random()*namePrefixes.length)]} ${
            nameSuffixes[Math.floor(Math.random()*nameSuffixes.length)]
        }`;

        const spec = {
            name: generatedName,
            difficulty: Math.round(adjustedDifficulty * 10) / 10,
            mechanics: selectedMechanics,
            // يمكن إضافة خصائص أخرى مثل "سرعة اللعب" أو "عدد الأعداء" تُستنتج من البيانات
            estimatedPlayTime: Math.floor(Math.random() * 20) + 5, // دقائق
            timestamp: new Date().toISOString()
        };

        console.log('✨ تم توليد المواصفات:');
        console.log(JSON.stringify(spec, null, 2));
        return spec;
    }

    /**
     * 3. توليد الكود من المواصفات باستخدام قالب EJS.
     * هذه الطبقة منفصلة تماماً عن منطق التعلم.
     */
    async generateCodeFromSpec(spec, templateName = 'gameTemplate.ejs') {
        console.log(`🔧 توليد الكود باستخدام القالب ${templateName}...`);
        
        const templatePath = path.join(this.templateDir, templateName);
        const templateContent = await fs.readFile(templatePath, 'utf-8');
        
        // يمكن هنا إضافة عمليات معالجة مسبقة للمواصفات إذا لزم الأمر
        const renderedCode = ejs.render(templateContent, { spec });
        
        // حفظ الملف المُولد
        const safeName = spec.name.replace(/\s+/g, '_').replace(/[^\w\d_]/g, '');
        const outputFilePath = path.join(this.outputDir, `${safeName}_${Date.now()}.js`);
        await fs.writeFile(outputFilePath, renderedCode, 'utf-8');
        
        console.log(`✅ تم حفظ الكود المُولد في: ${outputFilePath}`);
        return outputFilePath;
    }

    /**
     * (للتوسع المستقبلي) تقييم القالب المُولد.
     * هنا يمكن تشغيل محاكاة للعبة وجمع مقاييس لتحسين النموذج.
     */
    evaluateGeneratedTemplate(generatedFilePath) {
        // في النسخة المتقدمة: تشغيل ملف اللعبة في بيئة افتراضية وجمع بيانات
        console.log('📊 (تقييم افتراضي) تم تقييم القالب بدرجة 87% مناسبة.');
        return { score: 0.87 };
    }
}

module.exports = SmartEngineer;
