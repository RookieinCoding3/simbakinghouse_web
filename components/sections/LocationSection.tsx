export default function LocationSection() {
  return (
    <section className="py-20 bg-bakery-dark paper-texture min-h-[80vh] flex items-center">
      <div className="container mx-auto px-6 max-w-6xl">
        <div className="grid lg:grid-cols-2 gap-16 items-center">

          {/* Column 1: Minimal Info */}
          <div className="space-y-10">
            <div>
              <h1 className="font-heading text-bakery-accent text-5xl md:text-6xl mb-4 tracking-tight leading-none">
                VISIT THE HOUSE
              </h1>
              <p className="font-body text-bakery-cream/60 text-lg leading-relaxed">
                Tingkat Sungai Ara 1, Sungai Ara<br />
                11900 Bayan Lepas, Pulau Pinang
              </p>
            </div>

            <div className="space-y-6 border-l-2 border-bakery-accent/30 pl-6">
              <div>
                <h3 className="font-heading text-bakery-cream text-xl uppercase mb-2 tracking-wide">
                  Hours
                </h3>
                <p className="font-body text-bakery-cream/70 text-base">
                  Daily: 6:30 AM — 1:00 PM
                </p>
                <p className="font-body text-bakery-accent/80 text-sm mt-1 italic">
                  Fresh supplies available daily
                </p>
              </div>

              <div>
                <h3 className="font-heading text-bakery-cream text-xl uppercase mb-2 tracking-wide">
                  Connect
                </h3>
                <a
                  href="https://wa.me/60123456789"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-body text-bakery-accent hover:text-bakery-accent/80 text-base transition-colors inline-block hover:underline"
                >
                  WhatsApp Us Directly
                </a>
                <br />
                <a
                  href="mailto:simbakinghouse25@gmail.com"
                  className="font-body text-bakery-accent hover:text-bakery-accent/80 text-base transition-colors inline-block hover:underline mt-2"
                >
                  simbakinghouse25@gmail.com
                </a>
              </div>
            </div>
          </div>

          {/* Column 2: Map & Action */}
          <div className="space-y-6">
            <div className="w-full h-[400px] rounded-sm overflow-hidden shadow-2xl border border-bakery-cream/10">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3971.822844789771!2d100.26833837587894!3d5.323661234803908!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x304ac1d3e299a5e3%3A0x858a5f78c301745b!2sSIM%20BAKING%20HOUSE!5e0!3m2!1sen!2smy!4v1737005000000!5m2!1sen!2smy"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Sim Baking House Location"
              ></iframe>
            </div>
            <a
              href="https://www.google.com/maps/place/SIM+BAKING+HOUSE/@5.3236612,100.2703337,17z/data=!3m1!4b1!4m6!3m5!1s0x304ac1d3e299a5e3:0x858a5f78c301745b!8m2!3d5.3236612!4d100.2703337!16s%2Fg%2F11lm0kjz9b"
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full py-4 border-2 border-bakery-accent text-bakery-accent font-heading text-center hover:bg-bakery-accent hover:text-bakery-dark transition-all duration-300 tracking-widest text-sm"
            >
              OPEN IN GOOGLE MAPS
            </a>
          </div>

        </div>
      </div>
    </section>
  )
}
