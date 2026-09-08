export function KVKKPolicy() {
  return (
    <div className="prose prose-sm max-w-none text-gray-700 space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">KVKK Aydınlatma Metni</h3>
      <p className="text-xs text-gray-400">Son güncelleme: Eylül 2026</p>

      <p>
        6698 sayılı Kişisel Verilerin Korunması Kanunu ("KVKK") kapsamında, NextCV olarak
        kişisel verilerinizin işlenmesine ilişkin sizi bilgilendirmek isteriz.
      </p>

      <h4 className="font-semibold text-gray-800">1. Veri Sorumlusu</h4>
      <p>
        NextCV (nextcv.kadiray.com) veri sorumlusu sıfatıyla hareket etmektedir.
      </p>

      <h4 className="font-semibold text-gray-800">2. İşlenen Kişisel Veriler ve Açık Rızanız</h4>
      <p>
        NextCV varsayılan olarak istemci taraflı (client-side) çalışır; CV'nize girdiğiniz
        bilgiler tarayıcınızın yerel depolama alanında saklanır. Uygulamayı ilk açtığınızda
        gösterilen onay ekranında <strong>açıkça "Kabul Et" seçeneğini işaretlemeniz halinde</strong>,
        KVKK madde 5/2-a uyarınca açık rızanıza dayanarak: CV'nize girdiğiniz kişisel veriler
        (ad soyad, e-posta, telefon, iş/eğitim geçmişi vb.), içe aktardığınız PDF dosyasının
        kendisi, ve uygulamayı kullanım bilgileriniz (şablon/dil seçimi, hangi özellikleri
        kullandığınız, işlem zamanları) tarayıcınızda üretilen rastgele bir kimlikle
        ilişkilendirilerek sunucularımıza iletilir ve işlenir. Onay vermezseniz ya da
        onayınızı geri çekerseniz, bu veriler hiçbir şekilde sunucularımıza gönderilmez.
      </p>

      <h4 className="font-semibold text-gray-800">3. Verilerin İşlenme Amacı</h4>
      <p>
        İşlenen veriler, CV oluşturma hizmetinin sunulması ve ürünün nasıl kullanıldığının
        anlaşılarak geliştirilmesi amacıyla kullanılmaktadır.
      </p>

      <h4 className="font-semibold text-gray-800">4. Verilerin Aktarılması</h4>
      <p>
        Kişisel verileriniz üçüncü taraflara satılmaz veya pazarlama amacıyla paylaşılmaz.
        Sunucu tarafı barındırma için Cloudflare altyapısı, yazı tipi hizmeti için Google
        Fonts kullanılmakta olup, bu kapsamda sınırlı teknik veriler (ör. IP adresi) bu
        hizmet sağlayıcılarla paylaşılabilir.
      </p>

      <h4 className="font-semibold text-gray-800">5. Haklarınız</h4>
      <p>
        KVKK'nın 11. maddesi kapsamında; kişisel verilerinizin işlenip işlenmediğini
        öğrenme, işlenmişse buna ilişkin bilgi talep etme, işlenme amacını öğrenme,
        silinmesini veya yok edilmesini isteme haklarına sahipsiniz. Onayınızı sayfa
        altındaki "Gizlilik Tercihi" bağlantısından dilediğiniz an geri çekebilirsiniz —
        ancak bu, o ana kadar sunucuya gönderilmiş verileri otomatik silmez; sunucudaki
        verilerinizin silinmesini talep etmek için bizimle iletişime geçmeniz gerekir.
        Tarayıcınızın yerel depolama alanını temizlemek yalnızca cihazınızdaki kopyayı siler.
      </p>

      <h4 className="font-semibold text-gray-800">6. İletişim</h4>
      <p>
        KVKK kapsamındaki talepleriniz için{' '}
        <a href="mailto:kadiraycareer@gmail.com" className="text-primary">kadiraycareer@gmail.com</a>{' '}
        adresinden bizimle iletişime geçebilirsiniz.
      </p>
    </div>
  );
}
