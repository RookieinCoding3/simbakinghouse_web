export default function LocationSection() {
  return (
    <section
      id="location"
      className="py-16 md:py-24 bg-bakery-dark"
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
        {/* Section Header */}
        <div className="text-center mb-12">
          <p className="font-body text-bakery-accent text-sm sm:text-base tracking-widest uppercase mb-2">
            Find Us
          </p>
          <h2 className="font-heading text-bakery-cream text-4xl sm:text-5xl md:text-6xl mb-4">
            LOCATION
          </h2>
          <p className="font-body text-bakery-cream/80 text-lg max-w-2xl mx-auto">
            Visit our store in Penang for expert advice and quality baking supplies
          </p>
        </div>

        {/* Content Grid */}
        <div className="grid md:grid-cols-2 gap-8 items-start">
          {/* Address & Contact Info */}
          <div className="space-y-6">
            <div className="bg-bakery-cream/10 backdrop-blur-sm rounded-lg p-6 md:p-8 border border-bakery-cream/20">
              <h3 className="font-heading text-bakery-cream text-2xl mb-6">
                SIM BAKING HOUSE
              </h3>

              <div className="space-y-4">
                {/* Address */}
                <div className="flex items-start space-x-4">
                  <svg
                    className="w-6 h-6 text-bakery-accent flex-shrink-0 mt-1"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <div>
                    <p className="font-body text-bakery-cream text-base leading-relaxed">
                      Penang, Malaysia<br />
                      5.3236612, 100.2703337
                    </p>
                  </div>
                </div>

                {/* Opening Hours */}
                <div className="flex items-start space-x-4">
                  <svg
                    className="w-6 h-6 text-bakery-accent flex-shrink-0 mt-1"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <p className="font-heading text-bakery-cream text-lg mb-2">
                      Opening Hours
                    </p>
                    <p className="font-body text-bakery-cream/80 text-sm">
                      Daily: 6:30 AM - 1:00 PM
                    </p>
                  </div>
                </div>

                {/* Email */}
                <div className="flex items-start space-x-4">
                  <svg
                    className="w-6 h-6 text-bakery-accent flex-shrink-0 mt-1"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <div>
                    <p className="font-heading text-bakery-cream text-sm mb-1">
                      Email
                    </p>
                    <a
                      href="mailto:simbakinghouse25@gmail.com"
                      className="font-body text-bakery-accent hover:text-bakery-accent/80 text-base transition-colors"
                    >
                      simbakinghouse25@gmail.com
                    </a>
                  </div>
                </div>

                {/* WhatsApp */}
                <div className="flex items-start space-x-4">
                  <svg
                    className="w-6 h-6 text-green-400 flex-shrink-0 mt-1"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                  </svg>
                  <div>
                    <p className="font-heading text-bakery-cream text-sm mb-1">
                      WhatsApp
                    </p>
                    <a
                      href="https://wa.me/60123456789"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-body text-green-400 hover:text-green-300 text-base transition-colors"
                    >
                      Chat with us directly
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Directions Link */}
            <a
              href="https://www.google.com/maps/place/SIM+BAKING+HOUSE/@5.3690365,100.2608892,13z/data=!4m10!1m2!2m1!1ssim+baking+house+penang!3m6!1s0x304ac1d3e299a5e3:0x858a5f78c301745b!8m2!3d5.3236612!4d100.2703337!15sChdzaW0gYmFraW5nIGhvdXNlIHBlbmFuZ1oZIhdzaW0gYmFraW5nIGhvdXNlIHBlbmFuZ5IBBmJha2VyeeABAA!16s%2Fg%2F11lm0kjz9b"
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full bg-bakery-accent hover:bg-bakery-accent/90 text-bakery-brown font-heading text-center py-4 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              GET DIRECTIONS
            </a>
          </div>

          {/* Google Maps Embed */}
          <div className="w-full h-[400px] md:h-[500px] rounded-lg overflow-hidden shadow-2xl border-2 border-bakery-cream/20">
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
        </div>
      </div>
    </section>
  )
}
