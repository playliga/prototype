class nodejs::install {
	package {[
		'nodejs',
		'npm',
		'nodejs-legacy'
	]:
		ensure => installed,
	}
}
