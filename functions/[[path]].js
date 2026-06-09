const HTML_HEADERS = {
  "content-type": "text/html; charset=utf-8",
  "cache-control": "no-store",
  "x-content-type-options": "nosniff",
};

const SAFE_PROTOCOLS = new Set(["http:", "https:"]);
const STICKY_TARGET_COOKIE = "myst_target";
const TARGET_TOKEN_PREFIX = "b64.";
const ICON_CACHE_CONTROL = "public, max-age=86400";
const HOME_ICON_VERSION = "v=2";
const APPLE_TOUCH_ICON_BASE64 = "iVBORw0KGgoAAAANSUhEUgAAALQAAAC0CAYAAAA9zQYyAABd9klEQVR42uy9Z1xV59Y96td77/uek5Ne1Bh77xVFsIFKkd5Beu+9I9JBFBBFRKyIir33FnssiYmmVxONGhNNcpJzzvve/x33N+Zaa++10SSmgZ7Dh/lDd11777HGGnPM+cyn0//1ZHf89ujx8PHUb4v/+4HRs52ilxJPt3X0/s3x//xSPPNz0aedou9vi2f7olMHiDtA/LiDWB+dOkDcAeLHHcQPCegOEHeA+PEA8c8AugPEHSB+/EDcCtAdIO4A8eMNYmP0ewhAd4C4A8SPOIj10akDxB0gftxBzPgvNTp1gLgDxI87iP/LBNAdIO4A8WMO4t8E6A4Qd4D4UQXxQwO6A8QdIH4cQPyzgO4AcQeIHzcQ3wfoDhB3gPhxBrEJoDtA3AHixx3ErQDdAeIOED/eIDZG/7YGdAeIO0D8x4NYH506QNwB4scdxG0A6A4Qd4C47UD8X88Zo1MHiDtA/LiD+A8EdAeIO0Dc/iD+nYDuAHEHiB8tEP8GQHeAuAPEjy6IHxLQHSDuAPHjAeKfAXQHiDtA/PiBuBWgO0DcAeLHG8TGGIBOHSDuAPHjDmJ9dOoAcQeIH3cQtwGgO0DcAeK2A/GfBOgOEHeAuH1A/AcCugPEHSBufxD/TkB3gLgDxI8WiH8DoDtA3AHiRxfEDwnoDhB3gPjxAPHPALoDxB0gfvxA/N+66NQB4g4QP+4g/u/ntRj46wHdAeKHB3HrH/q/1egA8R8LYn106gDx7wfxfz/fD395YQD++uIgPPHSIPztpcH4W+cheLLzEDzVhTFUjSF4Sr39ST7mpUF44sVB+OsLA/GX5/t3gPg3gvihAN0B4p+O/3pOA/BA/K3zYDzZZSie7joMz7w8HM92G4HnXhmB57uPxAuMHqNMo/tIuY+Pea7bCDz78nA803WYAP7JzoMNAP9lJu8A8S8CugPEv8TE/fHEiwMV5iWAuw3Hc6+MxPM9RuHFnqPRudcYdO49Fl36jEPXvgwzvMzop0ZfM7mN9/ExfCyfw+cS7M+/MhLPdhsuJweZ/G8vDsJfnh/QAeJfEZ06QPxLbNxX2Jgy4qmuQxUQk3lVABOYBGq3/hPwygBzdB84ET0GTUTPQRboOdgCvQZbmgRv4318DB/L5/C5fA0BuQpwsrgG7idfGoK/vjBIZe0OEP96QHckdhJ/eUGRFGTjZykjeowSwHXtMw7d+o0XMBKYBGrvIZPQZ9hk9B0+Bf2GT0X/EVPRf+Q0DGgVvI338TF8LJ/D5/I1+FoC8H4T0LWPGTr3GosXeoyWq8DTXYfLlYE6vQPEDwPoDhAb3Al+yU+8ZATyiz1Gizwgi74yYIIC4iGWAsZ+w6cISAeOssKg0dYYPGY6hoydgaHjZiphZoNhavDf2u18DB/L5/C5/UdaCcj7DJuCXkMmoccgCwH3y33Ho3OfcXix5xi5Mjz98nBJOHmydYD4QYDuALHRG36uvzAgkzwmd9S1AuR+Zug+wFzkQp+hkwTEZFsBsAreYeNtMGKCHUaa22PURHuMspiF0RYOEmMsldD+z/v4GD6Wzxk23hZDx9lg8NiZGDR6OgYQ3COmygnTc4ilSJOX+yvAptThScaTjScdwfGfDuKfAfR/brGDXzh18jMvDxP9+hKlhTCyBuTJIhXIpoPHTsdQs5kYPsFWQDnaYhbGWDpi3GQnmE1xxvipLhITprmq4aaG8u/xU10lzKa4YNxkZ4yxdBKgj5w4C8Mn2AmT80QZONpa2J+sTWC/MnAiuvYbj5d6jxX5Qz3/8Gz97wviVoDuqNjRJqNHzCSM8oLJGRM1Jm/CyATyaGuRCWTikeZ2AuKxkxxVALvC3MoNE63dYTHdA5YzPDFpphcm2zC8MdnGRxfemDTTG5YzvGAx3RMTp3vA3Nod46e5wmyqC8ZOdsJoS4LbXph7yLiZ8t79BNiT0XOwJboNMEeXvmYiQxS2HvoT2vo/A8TGGNTWgH70ys604Z7uMlR8YbIydXL3geaikSktyMgE8nABsr1IBzIxQTzRyk0ATPBOsfXGVDtfTLP3g9Ws2bB28Md0hwBMd2wVDgGwdvSHlcNsTJvlh6n2vphi64NJNt6wmOEpJwXBPW6KM8ZMclRZWwfsEVPRa+gkRYaobC3aWiTIoP9IEOuj039y7wSLGE93HSoSg1qZzgUTPpEXI6dJ0sZkzgDkKc4iGyymu6sg9sE0e19YO8wWsM50DoKNSzBsXUNg5xYCe7dQ2LszwmDvEab+O1Tus3ULkcfyOdOdAuQEIMCn2BHcXnKiTLByw7gpLiqwFcamFGECSRnSY7CFXEk69x6H53uMloTxiZeG/MeBuA0A/eg3AClgHmYEMyXGYAv0HaZj5Qm2Ii3IyAqQFTaeaucjLDzDMQA2zkGwcw0RoDp4hMPRMwJOXpFw9o6Ciy8julVEwdknCk7ekXD0ioCDZ7gB5DYuQZjhFCDsTeYW1jYA21mkCDW2wtbT0Xf4VPQcMgndBkxE5z5mKqhH/GGgflxA/CcB+vHpYtPA/EL3UejSeyxe6T9BfGBKDDoXdC0UVnaU5I4yQAOyNYHsFAhbl2AFxJ7hAk4Xn2i4+sXA3T8WHgFx8AyMh2dgAryCTIO38T4+ho91nR0jQOdraOC2dQ3GDOdAYW3KGDI2tTZlzphJTiJDhprZYtCYGeg3Yhp6DZmMVwZMRJc+ZuJb/x5QP44g/gMB/fi1Yj7xwkCDzBAwD5ig6OURUwXMlBijJhpZ2XK6h+hjKw3IrsGY5R4m7OriEwU3vxgBJ8HqHZwI35Bk+IWlYDYjPBX+EWkmwdt4Hx/Dx/I5fC5fw03AHSWvPcsjTAV2EKwc/DHF1lcSyQlW7hg32QWjLBwwbLydCmorE1Ab5MeLg/8jQPw7Af349hP/9YUB0gSkyQxhZg3MY6Zj+HhNYjiLa6Gwsp/oYxthZA3I0cKuZFoBcWiyADUgMh2BURkIis5EcEwWQmKzEcqIUyM2W27jfXwMH8vn8Ll8Db4WX9PdP05Y29ErUt6T781jmGrvJzLE3NpDtPVoC0eRIIPGzkC/kUZQa/Ljqa7DVffj3xvEvwHQj39TPNszWTqmm8HydTeDzDAFM73hidYeYq9Z2SusTI1MOUDt6zY7VmSDT0iSsCwBGRSdgZDYLITF5SA8IRcRiXmITJqDqOR8REvMVSNfbuN9fAwfy+fwuQQ4X8svLBU+IcnyHm6z4+DsEw0HzwjYuYUqbD1rtth/lCBmU10x2lIHapEfk8TWY6L4XPdReLLLMNWn/vcF8X+/YIxO/ykrO1g0oc/8Us/RYnfRY9Y08zABs4MOzErSRweCmtbRO0L0sUcAGdkI5OCYTGHe8AQFwNEpcxGbWoC49CLEZxQjgZFZgkQ1+G/exvv4mNjUQkSnFCAyKV9eIzQuR9hbAzbfi+/J93b0Vth6pkuwSJDJtgS1pwHURvkxDT0HT8LL/c3xUq+x0gfyZOeh/9Yg/hlA/3suT2LhhL3KLwkzj1eYeQRtOfrLdhg10RTMTMboOFDHOvlECitT51IWUAeTTQk+sixZl8CMTy8S0CZnlyElpxypuRVIy5uHtDnzkK4G/83beB8fw8cmZpYiPr1YAXfyXEQkzpHXDorOgn9EOnxDU+AVlCjH4OQThVke4SJBrAXUvgZQj7JQQE33g1ednoMs5cR9sdcYPNNNSRL/XUHcCtD/fiBmDzGdDKWUPVTaMfnj8nLcf4SV9Eywh2LsJBZI3KRiR8ajXTaTiZ9biICZEoN6ltqWrEzNSw0ckaACOa1QGDcpu0xAStBm5M9HVsECZBdWIaeoGjlFNcgtVoL/ZmQXViOroEoemz6nUp7L10jIKEFsWpEC7IQ8eS++p8bWPBZKEFNQ+8iJyBNSEkUzWynA9Bk+Bd0HWaBr3/F4occY6dajnv53BLExBv9KQD/CICYLS89yl6HCxtTKtOX4g7Jc3J+MPFax48ZNchJvlwkWEy16v+JeeIbB2TtSrDS6Dt5BxoSPrEy9S2lBWUEgk2FT8ypUECsAzitZiDmltZhbvhgFFXVqLFFD+T/vm1O6CHkltQJwDdypefPkNQXYqYUiRcLicuW9Z4enqaCOvx/U1NTW7uJVj5zogCFmNhgwyhq9h6pJIvX0K6MU6fFvCGJ9dHqcQcyGdzKx9GG8PFzcC1k50nucALn7gIlSKGHSN2KCvTCyuZW7kvBRI7sEikZ28tJr5ET4haYgQKSFwshh8bkiBZjQxaUVITGrVFg1I79SmJjsm1+2SMBaVFmP4vlLUbKgAaVVy1BW3WgSvI338TF8LJ/D5+YWLxTmFmDnVsh78L2ikuciPD4XwSJB0uBDXU0XRORHmEgjq1n+mGTjI59t7GRnjDC3l5PXoKf7TZC+D/rTf31x8L8diH8Z0I+4JtaALD0Y3bR+5XHSO6w03VuIvGAbJi/BLJBojKwAOcgoKfT6ODINwZo+TshTAVyIhMxiJKkgpg7OmDtf2JhMTEASnKULGgSwFQtXoHLRSlQuWoX5i1djQZ1p8DbeN692BcprlgvA+fzCeUsMwCZjp82pFLamvo5JUSVIjArqkCS4ByhMzZL6TGcF1EqiqFh61NQsvgwcZY0+Q6dINfGl3uNETxPUf3lh0L8NiB8M6Mdk7oTWGSdA7jlGCgnd+isg5sqPvsOmSq8Dex5YUWMHG5t+2DQkrkUrbUw5QZ1Kj5g2GsFDF0Jj4fT8SmQVVgsLC4DLFgv4iufXC4gJSgJ0Qd0a1NQ3YeHSZixath6LGtdj8fINqFu+Qf7y/7y9dtk6LGxoRk39WlTVrcH8RavkJODJQGDzBOH75KhszeSR8iYmpUBAHWwAdTI8aO35xUqV0d4jXHVAAnTAdhVdTQnSf5QVeg2eLGxNj5rAllUwXYZKwvjzAH+0QWwK6MdkeApZWUnyRkh5V2nxNJdsngxEjTyQq0Wk2d5WGnrYlskGIhYl7CgtfCIFyLxs63WxMHF6EZKyyoSBs4SBa5CvMjClQemCZQJeMuv8xauEbauXNAkwCVICt37VRixdvRnLmragsWkrlq/dhhVrt8lf/p/RsHozlq7ahLoVLQJygpuvw9ect3CFMHaRytY8hoy5C5CSUyG6Oka1+ELjcg32nm9oquKCSMIYdV/CyO9g7GQXjDCfhUFjZ0r/R/eBFlJ8eUmWeI0Rv5rfKz1royR5fEDM+IsanR6HCUAKKw8VT5U/AlmmxyC16X6klRQV2BRP7Tha7YojK9O1sHENluoey8peKiMTyBFkYyZ3mSVIya1A5twFyCmuRn7pIhTOqxOdW17TiHm1K7FgsQJego8grFuxAUtWbhRgEqDL1mzB8uZtWLluB1Zv2Immlt1Yu2kPmjcz9kqs3cTYjTUtu7Bq/Q6saN4uz6tfuVEYvLahGVVL1ohc0diaySOvDGRq2n3JOWViDcaKtla8a3FCIjPgF653QqIUKULGnuUPSxtvkVxcSDB0vK0kjGxqIrBJCsw3KEde6DkWz74yCk91pc039LEB8V9+HaDbd4wVVzsrjUSjRV4wa2c/MBvemexJw/1Ee2FkyguWrCfbemO6k78kfM6+0VJ102w3Jlh0KaiJycZM6gxaeMFSVUKsRFUd5cNaLGpcJ2xK8C5bvUVh3ebtWLleAe+ajQp4Cdh1W/ahZdsBbNxxEJt2HMbmXYexZdcRbGbsPIxNOw9j4/aD2LD1gIC8aeNueZ3GJgXYPFnI+GRrHoeirevEEVG0dbVIoBQtaUwvlsKMeNexOfL5ZoelwksPbPcwqTDSzaE9SX09YuIsQxGmzzB27E1G90GW6NafvSDj8WJPuiKjVWAPeeRB/BCAfjRmsbG5hhbciz3GyNIjYWWu5+PqEbOZwsgakLWOuCl2vqKVWapmMYIJFB0LSovY1LkCBAXI1XJZL6pcIoxYSSZeskbRwI3rsWRFCxpWbUbj2q1YsW47VunAS+ASlC3bD2LjzkMqcI9iy+4j2Lb3GLbvO46dB05g54GT2HVQixPYuf8Eduw7jq17jmHLrsPy/PVb9wmw+R5ke7J1zdK1Iml4TOXVy+VqUTSvHnPL6zBHtfp4RaHNR/+amp9Xm8jEfKUoE5Up3rVWkGFPCEvn1g4B4oZMsPLAKLK1ma24IQNYjBlhhd7DpqLHYKUdtQv9a5Wxn+wyXMDyqIL4JwD9aA0UFDBzSRRXkfRXvGStiYgamckO2cZca+1ko72jv+hHJkn0kcnKdAaoO+lU8LJtBPJSkRRkQyZz1MFLVrZg6epNWN60VWHgll1o2qTIhvXb9gsAybJbdh/Ftj3HBJwELgG7++Ap7Dl8GnsPn8G+o2dw4Ng5HDx+DoeOv4aDavC2/UfPyuP4nB17j8tr8XX5HmR86myNrXlyVS1pkqRTEscqLXFcIqwtwC5YIMWZ5OxynX9tZGx+B7xCufrFYpZHBGY4B2Oq3WypMI6ZRN+avSBaO+pM9B9pLawtwO7PRqfxeL7HGENL6qMI4laAfvSmYtKSM4J5giwQpcSgczHC3E5YmcuUuHaPjKwAWem74GXWMygB/hGpCI/LlmpeSk6Z/PAEgQLk5QqQlzYLI9av2iRAopRYvWGXkYVFPhwS2bB1z1ED8+4+dAp7D5/WAfc1HDpxHkdOXMSRkxdx9NQlHDt9CcfPvIHjZ9/Aq2eVv8fOvC73HT5xAQeOn8O+I2cE2Nv3HpMThe+5duMerBYZogC7rnGDnGxkbboilEOK3deAYtXHJmvzRE2fM98kgYxIzEdITA4CItLFFWFRxsk7CrauoeKGWM70xvhp7uKGjLZ0wghzBww1szMAu/dQJpCW6Iofu9c4PPPKKPyty7BHDsRKDJHo9KiNduW8OPby0pITZh5iKcuh6F5QK3MRqbCy5ik7B4qDIW2dvtFymQ2ITBNdyYSP7MXEqmCeIi0I5IUNa1G3vEUu8cvXbsWq9TvRtHEP1m3eawSxKh927HsVuw6cVEB85Az26wF86qIBuCfOXsbJ197EqfNv4fSFKzh94SrOXLyKs5feNsTpi1fl/hOvXcbxM6/j8MmLckLsOXwK2/e9iq27j2LTjoPYsG0/mjftlQSSUmTZGr0zsu4+5lZnpHKpSBJWKjPpY+dVIjGrTBJIfhfsDfELT4NXYCJcfGNg7x6O6Y6B0g9iOUNpSTWb6iasrQDbFgPHzEBfFmeGTFZ87D5meLb7aDzZddgjBWJ9dHqURruyE4wrmGnLUTOLzNCBme4FtTLtKGFl12DRymyK13xlVvdYXaO2zJxbhblli0SDUo+S5cjICpC3iaQgG6/fuh8tOw6KFqaU2L7/VeykjDh02gjiV18TZj168qIw7atnL+PEuTdxiuC9eAXnLr2Nc2+8g/NvvIcLb76Hi2++j4tvvY9Lb32AS1eU4G3nL7+Hc6+/I6A/ce4yjp6+hEOvnseBY2ex59Bp0drb9h7H5l1H0bLtINZt2S+uCU86OilkblqDS1ZsxGJh72ZU1yu2n4B7wTIUzqvHnLJFyC6sQXr+fLEjKUXC4/MQGJUJ7+BkuPnFSVvqDKcgYWv2fVvO9IG51sE3yQnDWXEcRw/bGr2GTsErqt33XA+CevgjA+I/GdC/faAgZ0xwBTOX6DMBpGZWCiQqmLl6xE71ld1ChJXZd6FU+lLEjiOYk3PKkV1ULVqTSRUv1SxqLF21UUChyAqFjTftPCTMqMmJPYdOiRRQQHxeQKww8esiHU5oLHzxqoD4tTfeVQB85QO8fvVDXH77Y7z57icSb733Kd567zNcef9TXHnvU7z57qd44+2PcenKhzh/+X2cvfQOTp2/IifHMWHsC3LiUMpQk+/cf1ykDo+Rx0rWZgJJrb2imbJkm5yctBAJ7oUNCnOzWFNWvRxFtP7K6kRrU44kZZaJFAmNzcXs8HR4BCTAgQmj2pZq7RiAKfZ+IkUmWHtg7BQXjJTCjK0kjkwaXxlkic59J+C5HmN+Faj/TBD/CYD+/VMx2QnGaUWykmTgRHEzpAfD3E76E8jMAmYntUjiHamychL8w9MkCWI/cmpuOXKKa6QYwiIIWbluZYswG7Xp2s17xVrbpLLxjv0nsPvgSew9ctqUifUgPmcE8VkNxJffw0VhX4L4IwXA73+Gqx9cwzsffoF3P2Zcx3ufXMd7H9+Qf/O2tz/8XED+5jufyHN5MrxGxr54VU4WyheeQAePn8d+svbhU9i1/6SwNmWQOCOUJGL77RFZItbfWiO4FzVuUO2/1aioWY6S+Q3IL1uM7KIakSIJ6SWirwOjM8XiY8LIfms7Q791gKE1dRxbU8W/tseA0TPQe/g0I6i7j8HfugxvdxD/5UVjdHoUhmwrUmOYjLniSpLeQydJC6RS8XN6QMUvShqJmOiwWhYm3nKhlKrp17IszeSJjEVWpg7lj79+6wFFVuw9piR3h09hPxM70cQaiC+1YuIrOHvpqsiE1y5TTigygmz8xjsKG195/zMBKgH73ic38MFnX+LDa7fw8ee38fEXanx+Gx9duyX38TF8/JX3r+HyOx/La/F1z73+rqqzCezLkkBSqys6mwnkKezYd0KAvUm1/Wgfrtu8T9wYSigWd8jcS1dtluol9TbL8kwkydiUItTYSdnliE4tQEhctmhrzyBFW5Oxbd1CMd2J3vVsWMz0htk0d4y2dMawCfaiqwXUAy3xUp/xoqmf6DysXUH8OwD958wn5ow2g9QYbCG6mZU/Vv24UJXeqbXIjFDJ0glmNhPRlmJ/AwsMCphrxNbiJZcSY9nqzaI9+YOz2EH/V2TFYYWNqV31cuKkCYjfVkD8xrs4r+lhyoq3PxIQvvnepwqQP7iGdz/SgHxTQPvJF1/hsxtf49rNb/D5rbv44tZdfH7zG1y7+TU+vfG1AJyPJWu//dEXIk14cvD1z7/5Hs5deleSypOvvSXHZXRGXsNe2n6HTmHH/lfFHeFnYuGGiSxlieaU0Ddf3rwdDWu2SDLJk3t+3WpJjJkg5xQvFBuTJf/wBDVpDEuV/hAnaXoKF4tvGiuNM33EDSGoDUw9bCq6DbDAi73N8Gy3UVJZbC8Q/0pA/7lDtsnOT788TCw6dsr10do9zZX1fVzpTDfDxjVECgTSixFiBDNXivCHUWSGCubG9Whcs1Uux0z4tuw8jO37jwsQBMgnzgsb6+XEGQOI38V5TVK8qYKYbPz2x7hMWaEysiItPsd7H1/H+58aGfnTG3cEyF/cvosbd77Fl19/j5tqfPn1d7h++x6uffkNPr3+lYCfJ8I7H30hr0eNfrvUwhQxWv8e8AoDK+q2J8I+AAAAAElFTkSuQmCC";
const FAVICON_32_BASE64 = "iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAFiUlEQVR42sXUe1SMeRgH8PfftShWqI2yokgyNe6jkkhHSZKyU0xJdJuRrtLtRJfDsI4ujoRoLZFLRJTUomQJdSKS7tdpdHPb3XP2fPe8v9dMM/ad7O4f5o/PqaY/vs88v+d5qG/G/oAhUxnfMUYQBiymYcQ4NtOJb2W0aIYsjBjjjUCpI3TIDFDqCB2pgFJHKGMmRk6YKSvg64YqotQROnKCsRyljlCZURONQf2fUC19M0wx5sFwzlKC/n28vvm/Dh01cZYc9V++qYa2MQxMLDHX0hHWq/iwc/KE3VpPWNvzMddyDQxmW0FDx+SLoUNMFAv4cnsN51jDcuUGOLv7w8t/J/yD4wgv/0g4uwfA0m4DDDnLvhgqp00KGD5UQ3sW9GbwsMDaGWvd/bBFGIXgXcnYve8wxKlZRPzedIgiEuDmKYKFrRummlgNG8qYTVDDDZKOwXyYL1kN2zUC+AXHIflgJjJO5eLsxZvIKyhFwe1y5Bfdw6lz+TiQdhIxiSkICI3HOo9AmC9xhIGpNTR0TP8ROloBpWp6tfTMMM/KCS4bAxERtx/HT1/GlZt3UVJWiYrHz1FV24iXjR14Xt9K/i4oqUDOpUJkZl8ihW4RRWGl82aYLnLAmEkcpdDR2qYMHVO6APaVMTKzwWrXrQiPESP7XD7uPqhCVW0Dnr1qIcFN7VJIBz6ip/8jXrd0o7q2EQ+e1KL0/hPSlSMncxEWI4a9iw9mcm2VQofMAaVqZbgWjvDwCcGhjNO4XVaJhlYJ2iX9aOnsRXPnG7RJ+tH15i06pYNo6eol/3/V3IW6pg7U1DWjuKySdEMUnojFK9wwTp8rD1VEsa0MvUr00NHvTreebnF333v0vv0DndK3aO8ZQId0kPxs6+5HW3cf0dEzAEnfe/T0f0BNXQt5soQDGXBw3QZdQ95n4RxofM9hCmBbGXr4fINicTT7Iu5UPEV9SzfaJUxwd+87SPreoUM6gFY6XNJPOkGHvxn8naCfqbD0N/x0OBuunkGfCmBCFVGq9nSaqTX4PiEQp2Uh78YdVDypxcuGDtJuOqD//Z+kGPpJ6ALooujPewY+oLWrD9UvmnDtVjnEqSexXrAdWlPmfRZuRlCq9lRTl4PlawRkkDJOXUB+4T2UP3qG2tdt8lY3d0hR39xFBpKeh8GPf5H21zV1orzyGXIuFyI2OQ1263ygqWsmD5XTJQWYqNzT6RwbuAqCEJ2QgiNZubhw7TaK7z7Cw+o6VL1oxNPnDXhcU4/ql01kAOnu0E/14OkLXC28h5SjZ+C7Ix7mFk5KoRq65nIU23GQrcyEqfPBtXQiLQyJFmNvygmyXj+fv06e5XrxfdwoqUDRnYf4taIKZY9qyMbkXi1GamYOgqP2YeVabxia2yqF0jQJLii24yAzmesIsxUC2PKDwRcmICA2DTvFWYhPPYsDWVeRfuYmjpwvRuaFEuJwzi3sO5aH2EO/QBiXDrfAPbBaL4KRxQalUGISg2I7DjKLBXuwZHMSVm1PgVvUcXglnoHf/osQHrqCoPRriMgswq4TJYjOKkXUiRKEHy3CjvQCBBzMg1fSWbhEHoNt4EHwvJKUQhlzCYrtOMj2lLP6R4Lr5IGlm3zh4BsClx1R4IfFgR8eB4+IeHjFJsE7Nhme0YnYtCsBGyN3wzUkBg6+obB09wXH0Z1QDFVEsR0HGd7GrZ9sI6y9hbDzD4G9KAz2ogjYBYbCZut2LN8WBHthGByDIuFAfx4QAitvIXgCX/AEfoRy8DxoTmZQbMdBtqfm60I/E6aES4QzXIanGDpGbj4otuMgY7RMAKNlniy8WGxmZ8NQDFVEsR0HVSujapBUtVdVKKFHW/CpgK8cqohSRyhjIcbqLQSljlBCn0GpI3Ss/iK5vwHcwxZAOBXuvgAAAABJRU5ErkJggg==";
const PROXY_BRIDGE_SCRIPT = `(() => {
  const cookieName = ${JSON.stringify(STICKY_TARGET_COOKIE)};
  const tokenPrefix = ${JSON.stringify(TARGET_TOKEN_PREFIX)};

  const base64UrlEncode = (bytes) => {
    let binary = "";
    for (const byte of bytes) binary += String.fromCharCode(byte);
    return btoa(binary).replace(/\\+/g, "-").replace(/\\//g, "_").replace(/=+$/g, "");
  };

  const base64UrlDecode = (value) => {
    const padded = value.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4 - (value.length % 4)) % 4);
    const binary = atob(padded);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
    return bytes;
  };

  const encodeTarget = (value) => tokenPrefix + base64UrlEncode(new TextEncoder().encode(String(value)));

  const decodeTarget = (value) => {
    if (!value) return "";
    if (!value.startsWith(tokenPrefix)) return value;
    try {
      return new TextDecoder().decode(base64UrlDecode(value.slice(tokenPrefix.length)));
    } catch {
      return "";
    }
  };

  const readCookie = (name) => {
    const match = document.cookie.match(new RegExp("(^|; )" + name + "=([^;]*)"));
    return match ? decodeURIComponent(match[2]) : "";
  };

  const writeCookie = (name, value) => {
    document.cookie = name + "=" + encodeURIComponent(value) + "; Path=/; SameSite=Lax";
  };

  const current = new URL(location.href);
  const fromQuery = decodeTarget(current.searchParams.get("t"));
  if (fromQuery) {
    sessionStorage.setItem(cookieName, fromQuery);
    writeCookie(cookieName, fromQuery);
  }

  const storedTarget = () => fromQuery || sessionStorage.getItem(cookieName) || readCookie(cookieName);

  const resolveTarget = (input) => {
    const target = storedTarget();
    if (!target) return null;
    try {
      return new URL(input, target).toString();
    } catch {
      return null;
    }
  };

  const proxify = (input) => {
    const resolved = resolveTarget(input);
    return resolved ? "/p?t=" + encodeURIComponent(encodeTarget(resolved)) : input;
  };

  const originalPushState = history.pushState.bind(history);
  const originalReplaceState = history.replaceState.bind(history);

  history.pushState = function(state, title, url) {
    if (typeof url === "string" && url.length) {
      return originalPushState(state, title, proxify(url));
    }
    return originalPushState(state, title, url);
  };

  history.replaceState = function(state, title, url) {
    if (typeof url === "string" && url.length) {
      return originalReplaceState(state, title, proxify(url));
    }
    return originalReplaceState(state, title, url);
  };

  addEventListener("click", (event) => {
    const anchor = event.target && event.target.closest ? event.target.closest("a[href]") : null;
    if (!anchor || anchor.target === "_blank" || anchor.hasAttribute("download")) return;

    const href = anchor.getAttribute("href");
    if (!href || href.startsWith("#") || /^(javascript:|mailto:|tel:|data:)/i.test(href)) return;

    const proxied = proxify(href);
    if (proxied === href) return;

    event.preventDefault();
    location.assign(proxied);
  }, true);

  addEventListener("submit", (event) => {
    const form = event.target;
    if (!form || form.tagName !== "FORM") return;

    const action = form.getAttribute("action") || location.pathname + location.search;
    const proxiedAction = proxify(action);
    if (proxiedAction === action) return;

    const method = (form.getAttribute("method") || "get").toUpperCase();
    if (method === "GET") {
      event.preventDefault();
      const url = new URL(proxiedAction, location.href);
      const params = new URLSearchParams(new FormData(form));
      for (const [key, value] of params.entries()) {
        url.searchParams.append(key, value);
      }
      location.assign(url.toString());
      return;
    }

    form.action = proxiedAction;
  }, true);
})();`;

export async function onRequest(context) {
  const { request } = context;
  const url = new URL(request.url);

  if (isIconRoute(url.pathname)) {
    return serveIconRoute(url.pathname);
  }

  if (url.pathname === "/site.webmanifest") {
    return serveManifest();
  }

  const target = getTargetFromUrl(url);
  const stickyTarget = getStickyTarget(request);

  if (url.pathname === "/" && !target) {
    return new Response(renderHome(), { headers: HTML_HEADERS });
  }

  if (url.pathname === "/p" || url.pathname === "/proxy" || (url.pathname === "/" && target)) {
    return handleProxy(request, url, target);
  }

  if (!target && stickyTarget) {
    const fallbackTarget = resolveFallbackTarget(url, stickyTarget);
    if (fallbackTarget) {
      return Response.redirect(buildProxyUrl(fallbackTarget, url.origin), 302);
    }
  }

  return new Response(renderNotFound(), {
    status: 404,
    headers: HTML_HEADERS,
  });
}

function getTargetFromUrl(pageUrl) {
  const value = pageUrl.searchParams.get("t") || pageUrl.searchParams.get("url");
  if (!value) return null;
  return decodeTargetToken(value);
}

function isIconRoute(pathname) {
  return pathname === "/favicon.ico" || pathname === "/favicon-16x16.png" || pathname === "/favicon-32x32.png" || pathname === "/apple-touch-icon.png";
}

function serveIconRoute(pathname) {
  if (pathname === "/apple-touch-icon.png") {
    return binaryResponse(APPLE_TOUCH_ICON_BASE64, "image/png", ICON_CACHE_CONTROL);
  }

  return binaryResponse(FAVICON_32_BASE64, "image/png", ICON_CACHE_CONTROL);
}

function serveManifest() {
  const manifest = {
    name: "myst",
    short_name: "myst",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#08111f",
    theme_color: "#08111f",
    icons: [
      {
        src: `/favicon-16x16.png?${HOME_ICON_VERSION}`,
        sizes: "16x16",
        type: "image/png",
      },
      {
        src: `/favicon-32x32.png?${HOME_ICON_VERSION}`,
        sizes: "32x32",
        type: "image/png",
      },
      {
        src: `/apple-touch-icon.png?${HOME_ICON_VERSION}`,
        sizes: "180x180",
        type: "image/png",
      },
    ],
  };

  return new Response(JSON.stringify(manifest, null, 2), {
    headers: {
      "content-type": "application/manifest+json; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}

async function handleProxy(request, pageUrl, targetInput) {
  if (!targetInput) {
    return new Response(renderError("Enter a site to open."), {
      status: 400,
      headers: HTML_HEADERS,
    });
  }

  let targetUrl;
  try {
    targetUrl = normalizeTargetUrl(targetInput);
  } catch (error) {
    return new Response(renderError(error.message), {
      status: 400,
      headers: HTML_HEADERS,
    });
  }

  const upstreamRequest = buildUpstreamRequest(request, targetUrl);
  const upstreamResponse = await fetch(targetUrl, upstreamRequest);

  if (upstreamResponse.status >= 300 && upstreamResponse.status < 400) {
    const location = upstreamResponse.headers.get("location");
    if (location) {
      const redirected = resolveAndProxyUrl(location, targetUrl, pageUrl.origin);
      return Response.redirect(redirected, upstreamResponse.status);
    }
  }

  return rewriteResponse(upstreamResponse, targetUrl, pageUrl.origin);
}

function normalizeTargetUrl(input) {
  const trimmed = input.trim();
  const candidate = /^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;
  const url = new URL(candidate);

  if (!SAFE_PROTOCOLS.has(url.protocol)) {
    throw new Error("Only http and https URLs are allowed.");
  }

  return url;
}

function buildUpstreamRequest(request, targetUrl) {
  const headers = new Headers(request.headers);
  headers.delete("host");
  headers.delete("content-length");
  headers.delete("origin");
  headers.delete("referer");
  headers.delete("cf-connecting-ip");
  headers.delete("cf-ipcountry");
  headers.delete("cf-ray");
  headers.delete("x-forwarded-for");
  headers.delete("x-forwarded-host");
  headers.delete("x-forwarded-proto");

  headers.set("accept-encoding", "identity");
  headers.set("origin", targetUrl.origin);
  headers.set("referer", targetUrl.toString());

  const init = {
    method: request.method,
    headers,
    redirect: "manual",
  };

  if (request.method !== "GET" && request.method !== "HEAD") {
    init.body = request.body;
  }

  return init;
}

function resolveAndProxyUrl(location, baseUrl, origin) {
  const resolved = new URL(location, baseUrl);
  if (!SAFE_PROTOCOLS.has(resolved.protocol)) {
    return origin;
  }

  return buildProxyUrl(resolved.toString(), origin);
}

function buildProxyUrl(target, origin) {
  const proxyUrl = new URL("/p", origin);
  proxyUrl.searchParams.set("t", encodeTargetToken(target));
  return proxyUrl.toString();
}

function resolveFallbackTarget(requestUrl, stickyTarget) {
  try {
    const base = new URL(stickyTarget);
    if (!SAFE_PROTOCOLS.has(base.protocol)) {
      return null;
    }

    const candidate = new URL(requestUrl.pathname + requestUrl.search + requestUrl.hash, base.origin);
    return candidate.toString();
  } catch {
    return null;
  }
}

function getStickyTarget(request) {
  const cookie = request.headers.get("cookie") || "";
  const match = cookie.match(new RegExp(`(?:^|; )${STICKY_TARGET_COOKIE}=([^;]*)`));
  if (!match) return "";

  try {
    return decodeTargetToken(decodeURIComponent(match[1])) || "";
  } catch {
    return "";
  }
}

async function rewriteResponse(response, targetUrl, origin) {
  const headers = new Headers(response.headers);
  stripSecurityHeaders(headers);

  const contentType = headers.get("content-type") || "";

  if (contentType.includes("text/html")) {
    headers.delete("content-length");
    headers.delete("content-encoding");
    headers.delete("transfer-encoding");
    headers.append("set-cookie", `${STICKY_TARGET_COOKIE}=${encodeURIComponent(encodeTargetToken(targetUrl.toString()))}; Path=/; SameSite=Lax`);
    const rewriter = new HTMLRewriter()
      .on("link[rel~='icon']", new RemoveElement())
      .on("link[rel='apple-touch-icon']", new RemoveElement())
      .on("link[rel='manifest']", new RemoveElement())
      .on("head", new FaviconInjector())
      .on("head", new HeadScriptInjector())
      .on("a[href]", new AttributeRewriter("href", targetUrl, origin))
      .on("area[href]", new AttributeRewriter("href", targetUrl, origin))
      .on("link[href]", new AttributeRewriter("href", targetUrl, origin))
      .on("script[src]", new AttributeRewriter("src", targetUrl, origin))
      .on("img[src]", new AttributeRewriter("src", targetUrl, origin))
      .on("img[srcset]", new SrcsetRewriter(targetUrl, origin))
      .on("source[src]", new AttributeRewriter("src", targetUrl, origin))
      .on("source[srcset]", new SrcsetRewriter(targetUrl, origin))
      .on("iframe[src]", new AttributeRewriter("src", targetUrl, origin))
      .on("form[action]", new AttributeRewriter("action", targetUrl, origin))
      .on("audio[src]", new AttributeRewriter("src", targetUrl, origin))
      .on("video[src]", new AttributeRewriter("src", targetUrl, origin))
      .on("video[poster]", new AttributeRewriter("poster", targetUrl, origin))
      .on("object[data]", new AttributeRewriter("data", targetUrl, origin))
      .on("embed[src]", new AttributeRewriter("src", targetUrl, origin))
      .on("meta[http-equiv=refresh]", new MetaRefreshRewriter(targetUrl, origin))
      .on("[style]", new InlineStyleRewriter(targetUrl, origin));

    return rewriter.transform(new Response(response.body, { headers, status: response.status }));
  }

  if (contentType.includes("text/css")) {
    const css = await response.text();
    const rewritten = rewriteCss(css, targetUrl, origin);
    headers.delete("content-length");
    headers.delete("content-encoding");
    headers.delete("transfer-encoding");
    headers.append("set-cookie", `${STICKY_TARGET_COOKIE}=${encodeURIComponent(encodeTargetToken(targetUrl.toString()))}; Path=/; SameSite=Lax`);
    return new Response(rewritten, {
      status: response.status,
      headers,
    });
  }

  headers.append("set-cookie", `${STICKY_TARGET_COOKIE}=${encodeURIComponent(encodeTargetToken(targetUrl.toString()))}; Path=/; SameSite=Lax`);
  return new Response(response.body, {
    status: response.status,
    headers,
  });
}

function stripSecurityHeaders(headers) {
  headers.delete("content-security-policy");
  headers.delete("content-security-policy-report-only");
  headers.delete("x-frame-options");
  headers.delete("cross-origin-embedder-policy");
  headers.delete("cross-origin-opener-policy");
  headers.delete("cross-origin-resource-policy");
}

function proxifyUrl(value, baseUrl, origin) {
  const resolved = new URL(value, baseUrl);
  if (!SAFE_PROTOCOLS.has(resolved.protocol)) {
    return value;
  }

  const proxyUrl = new URL("/proxy", origin);
  proxyUrl.searchParams.set("url", resolved.toString());
  return proxyUrl.toString();
}

function rewriteCss(css, baseUrl, origin) {
  return css
    .replace(/@import\s+(?:url\()?["']?([^"')]+)["']?\)?/gi, (match, target) => {
      const proxied = proxifyUrl(target, baseUrl, origin);
      return match.replace(target, proxied);
    })
    .replace(/url\(\s*["']?([^"')]+)["']?\s*\)/gi, (match, target) => {
      if (/^data:|^blob:|^#/.test(target.trim())) {
        return match;
      }
      const proxied = proxifyUrl(target, baseUrl, origin);
      return `url("${proxied}")`;
    });
}

class AttributeRewriter {
  constructor(attribute, baseUrl, origin) {
    this.attribute = attribute;
    this.baseUrl = baseUrl;
    this.origin = origin;
  }

  element(element) {
    const value = element.getAttribute(this.attribute);
    if (!value || /^javascript:/i.test(value) || /^mailto:/i.test(value) || /^tel:/i.test(value)) {
      return;
    }

    element.setAttribute(this.attribute, proxifyUrl(value, this.baseUrl, this.origin));
  }
}

class SrcsetRewriter {
  constructor(baseUrl, origin) {
    this.baseUrl = baseUrl;
    this.origin = origin;
  }

  element(element) {
    const srcset = element.getAttribute("srcset");
    if (!srcset) return;

    const rewritten = srcset
      .split(",")
      .map((entry) => {
        const parts = entry.trim().split(/\s+/);
        const target = parts.shift();
        if (!target) return entry;
        const proxied = proxifyUrl(target, this.baseUrl, this.origin);
        return [proxied, ...parts].join(" ");
      })
      .join(", ");

    element.setAttribute("srcset", rewritten);
  }
}

class MetaRefreshRewriter {
  constructor(baseUrl, origin) {
    this.baseUrl = baseUrl;
    this.origin = origin;
  }

  element(element) {
    const content = element.getAttribute("content");
    if (!content) return;

    const rewritten = content.replace(/url\s*=\s*([^;]+)/i, (_, target) => {
      const cleanTarget = target.trim().replace(/^['"]|['"]$/g, "");
      const proxied = proxifyUrl(cleanTarget, this.baseUrl, this.origin);
      return `url=${proxied}`;
    });

    element.setAttribute("content", rewritten);
  }
}

class InlineStyleRewriter {
  constructor(baseUrl, origin) {
    this.baseUrl = baseUrl;
    this.origin = origin;
  }

  element(element) {
    const style = element.getAttribute("style");
    if (!style) return;

    element.setAttribute("style", rewriteCss(style, this.baseUrl, this.origin));
  }
}

class HeadScriptInjector {
  element(element) {
    element.append(`<script>${escapeScript(PROXY_BRIDGE_SCRIPT)}</script>`, {
      html: true,
    });
  }
}

class FaviconInjector {
  element(element) {
    element.prepend(
      `<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png?${HOME_ICON_VERSION}" />
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png?${HOME_ICON_VERSION}" />
<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png?${HOME_ICON_VERSION}" />
<link rel="manifest" href="/site.webmanifest" />`,
      { html: true },
    );
  }
}

class RemoveElement {
  element(element) {
    element.remove();
  }
}

function renderHome() {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="color-scheme" content="dark light" />
  <title>myst</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Michroma&display=swap" rel="stylesheet" />
  <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png?v=2" />
  <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png?v=2" />
  <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png?v=2" />
  <link rel="manifest" href="/site.webmanifest" />
  <style>
    :root {
      color-scheme: dark;
      --bg: #08111f;
      --bg2: #0f1f35;
      --card: rgba(10, 18, 31, 0.72);
      --line: rgba(174, 211, 255, 0.18);
      --text: #edf5ff;
      --muted: #9db4d6;
      --accent: #7cc7ff;
      --accent2: #9cf0dd;
      --shadow: 0 24px 80px rgba(0, 0, 0, 0.36);
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      min-height: 100vh;
      color: var(--text);
      background:
        radial-gradient(circle at top left, rgba(124, 199, 255, 0.18), transparent 30%),
        radial-gradient(circle at 80% 20%, rgba(156, 240, 221, 0.12), transparent 24%),
        linear-gradient(160deg, var(--bg), var(--bg2));
    }
    main {
      min-height: 100vh;
      display: grid;
      place-items: center;
      padding: 24px;
    }
    .shell {
      width: min(920px, 100%);
      background: var(--card);
      border: 1px solid var(--line);
      box-shadow: var(--shadow);
      backdrop-filter: blur(18px);
      border-radius: 28px;
      padding: clamp(24px, 5vw, 40px);
      overflow: hidden;
      position: relative;
    }
    .shell::before {
      content: "";
      position: absolute;
      inset: 0;
      background: linear-gradient(135deg, rgba(124, 199, 255, 0.09), transparent 42%, rgba(156, 240, 221, 0.08));
      pointer-events: none;
    }
    .kicker {
      letter-spacing: 0.18em;
      text-transform: uppercase;
      font-size: 0.78rem;
      color: var(--accent2);
      margin: 0 0 -10px;
    }
    h1 {
      margin: 0;
      font-family: "Michroma", ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      font-size: clamp(3rem, 10vw, 5.8rem);
      line-height: 0.92;
      letter-spacing: -0.06em;
    }
    .subtitle {
      margin: 18px 0 0;
      max-width: 58ch;
      color: var(--muted);
      font-size: 1.05rem;
      line-height: 1.6;
    }
    form {
      display: grid;
      gap: 12px;
      margin-top: 28px;
      grid-template-columns: 1fr auto;
    }
    input, button {
      border-radius: 18px;
      border: 1px solid var(--line);
      font: inherit;
      padding: 16px 18px;
    }
    input {
      background: rgba(255, 255, 255, 0.06);
      color: var(--text);
      outline: none;
    }
    input::placeholder { color: rgba(237, 245, 255, 0.48); }
    input:focus {
      border-color: rgba(124, 199, 255, 0.7);
      box-shadow: 0 0 0 4px rgba(124, 199, 255, 0.12);
    }
    button {
      background: linear-gradient(135deg, var(--accent), var(--accent2));
      color: #07111d;
      font-weight: 700;
      cursor: pointer;
      min-width: 152px;
    }
    .meta {
      display: flex;
      gap: 14px;
      flex-wrap: wrap;
      margin-top: 18px;
      color: var(--muted);
      font-size: 0.93rem;
    }
    .pill {
      border: 1px solid var(--line);
      background: rgba(255, 255, 255, 0.05);
      padding: 10px 14px;
      border-radius: 999px;
    }
    .note {
      margin-top: 24px;
      color: var(--muted);
      font-size: 0.9rem;
    }
    @media (max-width: 680px) {
      form { grid-template-columns: 1fr; }
      button { width: 100%; }
      .shell { border-radius: 22px; }
    }
  </style>
</head>
<body>
  <main>
    <section class="shell">
      <p class="kicker">raincloud proxy</p>
      <h1>myst</h1>
      <p class="subtitle">
        A lightweight browser-based tunnel for websites. Paste a URL, and myst will fetch and rewrite it so you can browse through Cloudflare Pages Functions.
      </p>
      <form id="proxy-form" action="/p" method="get">
        <input
          id="site-input"
          type="text"
          placeholder="https://example.com"
          autocomplete="url"
          inputmode="url"
          required
        />
        <input id="encoded-target" name="t" type="hidden" />
        <button type="submit">Open site</button>
      </form>
      <script>
        (() => {
          const form = document.getElementById('proxy-form');
          const input = document.getElementById('site-input');
          const encodedTarget = document.getElementById('encoded-target');
          if (!form || !input) return;

          const tokenPrefix = ${JSON.stringify(TARGET_TOKEN_PREFIX)};

          const base64UrlEncode = (bytes) => {
            let binary = "";
            for (const byte of bytes) binary += String.fromCharCode(byte);
            return btoa(binary).replace(/\\+/g, "-").replace(/\\//g, "_").replace(/=+$/g, "");
          };

          const encodeTarget = (value) => {
            const bytes = new TextEncoder().encode(String(value));
            return tokenPrefix + base64UrlEncode(bytes);
          };

          form.addEventListener('submit', () => {
            const raw = input.value.trim();
            encodedTarget.value = raw ? encodeTarget(raw) : "";
          });
        })();
      </script>
      <div class="meta">
        <span class="pill">Works on macOS</span>
        <span class="pill">Works on Chromebook</span>
        <span class="pill">Works on Windows</span>
      </div>
      <p class="note">
        Use with sites you are allowed to access. Some advanced web apps may need extra proxy rewriting support.
      </p>
    </section>
  </main>
</body>
</html>`;
}

function renderError(message) {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>myst</title>
  <style>
    body {
      margin: 0;
      min-height: 100vh;
      display: grid;
      place-items: center;
      background: #08111f;
      color: #edf5ff;
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      padding: 24px;
    }
    .card {
      max-width: 640px;
      width: 100%;
      padding: 28px;
      border-radius: 24px;
      background: rgba(10, 18, 31, 0.8);
      border: 1px solid rgba(174, 211, 255, 0.18);
    }
    a { color: #7cc7ff; }
  </style>
</head>
<body>
  <div class="card">
    <h1>myst</h1>
    <p>${escapeHtml(message)}</p>
    <p><a href="/">Go back</a></p>
  </div>
</body>
</html>`;
}

function renderNotFound() {
  return renderError("That route does not exist.");
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function escapeScript(value) {
  return String(value)
    .replace(/<\/script/gi, "<\\/script")
    .replace(/<!--/g, "<\\!--");
}

function binaryResponse(base64, contentType, cacheControl) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }

  return new Response(bytes, {
    headers: {
      "content-type": contentType,
      "cache-control": cacheControl,
    },
  });
}

function encodeTargetToken(value) {
  const bytes = new TextEncoder().encode(String(value));
  return TARGET_TOKEN_PREFIX + base64UrlEncode(bytes);
}

function decodeTargetToken(value) {
  if (typeof value !== "string") return null;
  if (!value.startsWith(TARGET_TOKEN_PREFIX)) {
    return value;
  }

  try {
    const bytes = base64UrlDecode(value.slice(TARGET_TOKEN_PREFIX.length));
    return new TextDecoder().decode(bytes);
  } catch {
    return null;
  }
}

function base64UrlEncode(bytes) {
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function base64UrlDecode(value) {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4 - (value.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}
