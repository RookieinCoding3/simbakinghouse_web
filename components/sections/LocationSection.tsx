export default function LocationSection() {
  return (
    <section
      id="location"
      className="py-16 md:py-24 bg-bakery-brown"
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
            Visit us in Penang and experience the warmth of artisan baking
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
                      Monday - Saturday: 8:00 AM - 7:00 PM<br />
                      Sunday: 9:00 AM - 5:00 PM
                    </p>
                  </div>
                </div>

                {/* Contact */}
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
                    <path d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <div>
                    <p className="font-body text-bakery-cream/80 text-base">
                      Contact us for inquiries
                    </p>
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
